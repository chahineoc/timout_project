import { z } from "zod";
import { db } from "../../db";
import { router, publicProcedure } from "../trpc";
import {
  employees as employeesTable,
  leavePolicies as leavePoliciesTable,
  leaveRequests as leaveRequestsTable,
} from "../../db/schema";
import { eq } from "drizzle-orm";
import { getCurrentEmployeeId } from "../utils/auth";
import { startOfDay } from "date-fns";
import { calculateWorkingDays,validateLeaveRequest } from "../utils/leave-calculations";


export default router({
  getLeaveRequests: publicProcedure.query(async () => {
    const leaveRequests = await db.query.leaveRequests.findMany({
      with: {
        employee: true,
        leavePolicy: true,
      },
    });
    const enrichmentPromises = leaveRequests.map(async (request) => {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      const workingDaysCount = await calculateWorkingDays(startDate, endDate); // Await the calculation

      return {
        ...request,
        workingDaysCount,
      };
    });

    // Wait for all enrichment promises to resolve
    const enrichedLeaveRequests = await Promise.all(enrichmentPromises);

    return enrichedLeaveRequests;
  }),
  createLeaveRequest: publicProcedure
    .input(
      z.object({
        leavePolicyId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .mutation(async (opts) => {
      const { input } = opts;
      const startDate = startOfDay(new Date(input.startDate));
      const endDate = startOfDay(new Date(input.endDate));

      if (endDate< startDate) {
        throw new Error("End date should be greater or equal to the start date");
      }
      const employee = await db.query.employees.findFirst({
        where: eq(employeesTable.id, getCurrentEmployeeId()),
      });
      if (!employee) {
        throw new Error("No employee found");
      }

      const leavePolicy = db
        .select()
        .from(leavePoliciesTable)
        .where(eq(leavePoliciesTable.id, input.leavePolicyId))
        .get();

      if (!leavePolicy) {
        throw new Error("No leave policy found");
      }
      // Validate if the leave request is permissible under the current policy
      const isValid = await validateLeaveRequest(employee.id, leavePolicy.id, startDate, endDate);

      if (!isValid) {
        throw new Error("Leave request exceeds the allowed days under the selected leave policy");
      }

      return await db
        .insert(leaveRequestsTable)
        .values({
          employeeId: employee.id,
          leavePolicyId: leavePolicy.id,
          startDate,
          endDate,
          status: "pending",
        })
        .returning();
    }),
    updateStatus: publicProcedure
    .input(
      z.object({
        leaveRequestId: z.number(),
        newStatus: z.enum(["approved", "rejected"]),
      })
    )
    .mutation(async ({ input }) => {
      const { leaveRequestId, newStatus } = input;
  
      return await db.update(leaveRequestsTable) 
        .set({ status: newStatus })
        .where(eq(leaveRequestsTable.id, leaveRequestId)) 
        .execute(); 
    }),
  
  
});
