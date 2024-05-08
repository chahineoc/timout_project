import { employees as employeesTable, leaveRequests as leaveRequestsTable ,holidays as holidayTable} from "../../db/schema";
import { or, eq, and, gte, lte } from "drizzle-orm";
import { LeavePolicy } from "../../db/schema-types";
import { isWeekend, isSameDay,eachDayOfInterval, startOfDay, isWithinInterval } from "date-fns";
import { db } from "../../db";
import { eachYearOfInterval, startOfYear, lastDayOfYear } from 'date-fns';
import { leavePolicies as leavePoliciesTable } from '../../db/schema';



type GetDatesProps = {
  leaveRequests: ({
    startDate: Date;
    endDate: Date;
  } & { leavePolicy: LeavePolicy })[];
  startDate: Date;
  endDate: Date;
};

export function getDateDetails({ leaveRequests, startDate, endDate }: GetDatesProps) {
  const dates = eachDayOfInterval({ start: startDate, end: endDate }).map((date) => startOfDay(date));

  return dates.map((date) => {

      if (isWeekend(date)) {
        return {
          type: "weekend" as const,
          date,
        };
      }
    const leavePriorities: Record<string, number> = {
      // Sick Leave
      "2": 1,
      // Annual leave
      "1": 2,
      // Remote work
      "3": 3,
    };
    // Sort leave requests by priority and take the first one. If two leaves
    // have an overlapping date we prefer the one with higher priority
    const leaveRequest = leaveRequests
      .filter((leaveRequest) => {
        return isWithinInterval(date, {
          start: leaveRequest.startDate,
          end: leaveRequest.endDate,
        });
      })
      .sort((a, b) => {
        if ((leavePriorities[`${a.leavePolicy.id}`] ?? 0) - (leavePriorities[`${b.leavePolicy.id}`] ?? 0) > 0) {
          return 1;
        }
        return -1;
      })[0];

    if (leaveRequest) {
      return {
        type: "leave" as const,
        date,
        leavePolicy: leaveRequest.leavePolicy,
      };
    }
    return {
      type: "work" as const,
      date,
    };
  });
}

export async function getEntitlements(employeeId: number, year: number) {
  const startDate = new Date(`${year}/01/01`);
  const endDate = new Date(`${year}/12/31`);

  // Fetch leave requests with status pending or approved
  const employeeQuery = await db.query.employees.findFirst({
    where: eq(employeesTable.id, employeeId),
    with: {
      leaveRequests: {
        where: and(
          gte(leaveRequestsTable.endDate, startDate),
          lte(leaveRequestsTable.startDate, endDate),
          or(eq(leaveRequestsTable.status, "pending"), eq(leaveRequestsTable.status, "approved"))
        ),
        with: {
          leavePolicy: true,
        },
      },
    },
  });

  if (!employeeQuery) {
    throw new Error("No employee found");
  }

  const { leaveRequests, ...employee } = employeeQuery;

  const leavePolicies = await db.query.leavePolicies.findMany();

  const employeeDates = getDateDetails({ leaveRequests, startDate, endDate });
  
  


  type EmployeeEntitlement = LeavePolicy & { alreadyTaken: number };

  const entitlement = leavePolicies.map((leavePolicy) => {
    return {
      ...leavePolicy,
      alreadyTaken: employeeDates.filter(({ type, leavePolicy: lp }) => type === "leave" && lp?.id === leavePolicy.id)
        .length,
    };
  }, {} as Record<string, EmployeeEntitlement>);

  return {
    details: employee,
    entitlement,
  };
}
export async function calculateWorkingDays(startDate: Date, endDate: Date): Promise<number> {
  const daysArray = eachDayOfInterval({ start: startDate, end: endDate });

  const holidays = await db.query.holidays.findMany();
  
  const workingDays = daysArray.filter(day => !isWeekend(day) && !holidays.some(holiday => isSameDay(holiday.date, day)));


  return workingDays.length;
  
}



export async function validateLeaveRequest(employeeId: number, leavePolicyId: number, startDate: Date, endDate: Date): Promise<boolean> {
  const years = eachYearOfInterval({ start: startDate, end: endDate });

  for (const year of years) {
    const yearStart = startOfYear(year);
    const yearEnd = lastDayOfYear(year);

    const currentYearStart = startDate > yearStart ? startDate : yearStart;
    const currentYearEnd = endDate < yearEnd ? endDate : yearEnd;

    const workingDays = await calculateWorkingDays(currentYearStart, currentYearEnd);


    try {
      const leaveEntitlement = await db.query.leavePolicies.findFirst({
        where: eq(leavePoliciesTable.id, leavePolicyId),
        with: {
          leaveRequests: {
            where: and(
              eq(leaveRequestsTable.employeeId, employeeId),
              gte(leaveRequestsTable.endDate, yearStart),
              lte(leaveRequestsTable.startDate, yearEnd),
              or(eq(leaveRequestsTable.status, "pending"), eq(leaveRequestsTable.status, "approved"))
            ),
          },
        },
      });

      if (!leaveEntitlement) {
        throw new Error("No leave policy found.");
      }

      const requests = (leaveEntitlement.leaveRequests as any[]) || [];


      let takenDays = 0;
      for (const request of requests) {
        takenDays += await calculateWorkingDays(new Date(request.startDate), new Date(request.endDate));
      }


      const allowedDays = leaveEntitlement.allowedDaysPerYear ?? 0;

      if (workingDays > (allowedDays - takenDays)) {
        return false;
      }
    } 
  }
  return true;
}

