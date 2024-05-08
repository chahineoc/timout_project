import { trpc } from "../../utils/trpc";
import { format } from "date-fns";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../backend/src/router";
import SearchIcon from "../icon-search.svg";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/table";
import RefreshIcon from "~/app/icon-refresh.svg";
import SunIcon from "~/app/icon-sun.svg";
import SickIcon from "~/app/icon-sick.svg";
import HouseIcon from "~/app/icon-house.svg";
import { useState } from "react";

export default function RequestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const requestsQuery = trpc.leaveRequests.getLeaveRequests.useQuery();
  const updateStatus = trpc.leaveRequests.updateStatus.useMutation();

  const { data } = requestsQuery;

  const filteredData = data?.filter(request =>
    `${request.employee.firstName} ${request.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.leavePolicy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.status.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleStatusChange = (id: number, newStatus: string) => {
    if (newStatus === 'approved' || newStatus === 'rejected') {
      updateStatus.mutate({ leaveRequestId: id, newStatus }, {
        onSuccess: () => {
          requestsQuery.refetch();
        }
      });
    } 
  };
  
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center justify-start px-6">
        <h1 className="mr-6 text-3xl font-bold text-black-dark">Requests</h1>
        <div className="flex h-10 w-[473px] items-center rounded-3xl bg-white">
          <div
            className="ml-4 mr-[10px] h-[14px] w-[14px] bg-contain bg-no-repeat"
            style={{
              backgroundImage: `url(${SearchIcon})`,
            }}
          ></div>
          <input
            className="w-full rounded-3xl outline-none"
            placeholder="Search for a request"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex h-14 items-end justify-end px-6">
        <button
          onClick={() => {
            requestsQuery.refetch();
          }}
          type="button"
          aria-label="Refresh"
          className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white active:opacity-50"
        >
          <div
            className="h-[14px] w-[14px] bg-contain bg-no-repeat"
            style={{
              backgroundImage: `url(${RefreshIcon})`,
            }}
          ></div>
        </button>
      </div>
      {requestsQuery.isLoading && <div>Loading...</div>}
      {requestsQuery.error && <div className="text-red">{requestsQuery.error.message}</div>}
      {filteredData && (filteredData.length === 0 ? <div>No requests found!</div> : <RequestsTable data={filteredData} handleStatusChange={handleStatusChange} />)}
    </div>
  );
}


type RouterOutput = inferRouterOutputs<AppRouter>;
type LeaveRequestsResponse = RouterOutput["leaveRequests"]["getLeaveRequests"];

function RequestsTable(props: { data: LeaveRequestsResponse, handleStatusChange: (id: number, status: string) => void }) {
  const { data, handleStatusChange } = props;

  return (
    <div className="min-h-0">
      <div className="h-full p-6">
        <div className="h-full rounded-md border">
          <Table wrapperClassName="h-full overflow-y-auto position-relative" className="h-full">
            <TableHeader>
              <TableRow className="sticky top-0 bg-white text-blue shadow">
                <TableHead>EMPLOYEE</TableHead>
                <TableHead>TYPE</TableHead>
                <TableHead>WORKING DAYS</TableHead> 
                <TableHead>STARTING</TableHead>
                <TableHead>ENDING</TableHead>
                <TableHead>STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((leaveRequest) => (
                  <TableRow key={leaveRequest.id} className="bg-white">
                    <TableCell className="font-bold">
                      {leaveRequest.employee.firstName} {leaveRequest.employee.lastName}
                    </TableCell>
                    <TableCell>
                      <LeavePolicyCell value={leaveRequest.leavePolicy.title} />
                    </TableCell>
                    <TableCell>
                      {typeof leaveRequest.workingDaysCount === 'number'
                        ? leaveRequest.workingDaysCount
                        : 'Loading...'}
                    </TableCell>
                    <TableCell>{format(leaveRequest.startDate, "dd/MM/yyyy")}</TableCell>
                    <TableCell>{format(leaveRequest.endDate, "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div>{`${leaveRequest.status[0].toUpperCase()}${leaveRequest.status.slice(1)}`}</div>
                        {leaveRequest.status === 'pending' && (
                          <div className="ml-4 space-x-2">
                            <button
                              type="button"
                              className="flex h-9 items-center rounded-md border border-green px-8 text-sm text-green outline-none transition-colors duration-300 hover:bg-green hover:text-white focus:ring-2 focus:ring-green active:opacity-60 active:transition-none"
                              onClick={() => handleStatusChange(leaveRequest.id, 'approved')}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="flex h-9 items-center rounded-md border border-red px-8 text-sm text-red outline-none transition-colors duration-300 hover:bg-red hover:text-white focus:ring-2 focus:ring-red active:opacity-60 active:transition-none"
                              onClick={() => handleStatusChange(leaveRequest.id, 'rejected')}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function LeavePolicyCell({ value }: { value: string | undefined }) {
  const [icon, colorClass, iconClass] = value
    ? {
        "Annual Leave": [SunIcon, "text-purple", "h-[15.4px] w-[15px]"],
        "Sick Leave": [SickIcon, "text-yellow-dark", "h-[14px] w-[14px]"],
        "Remote Work": [HouseIcon, "text-blue", "h-[13px] w-[16px]"],
      }[value] ?? []
    : [];

  return (
    <div className={`flex items-center ${colorClass ?? ""}`}>
      {icon && (
        <div
          className={`m-1 ${iconClass} bg-contain bg-no-repeat`}
          style={{
            backgroundImage: `url(${icon})`,
          }}
        ></div>
      )}
      {value ?? "9 hrs"}
    </div>
  );
}
