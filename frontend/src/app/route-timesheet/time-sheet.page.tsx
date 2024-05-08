import { useMemo, useState } from "react";
import { trpc } from "../../utils/trpc";
import { addDays, format, startOfDay } from "date-fns";
import SunIcon from "~/app/icon-sun.svg";
import SickIcon from "~/app/icon-sick.svg";
import HouseIcon from "~/app/icon-house.svg";
import SearchIcon from "~/app/icon-search.svg";
import RefreshIcon from "~/app/icon-refresh.svg";
import LeftArrowIcon from "./icon-arrow-left.svg";
import RightArrowIcon from "./icon-arrow-right.svg";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../backend/src/router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/table";
import { useCurrentSession } from "../auth";

export default function TimeSheetPage() {
  const today = startOfDay(new Date());
  const [{ startDate, endDate }, setDateInterval] = useState({
    startDate: today,
    endDate: addDays(today, 6),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const timesheetQuery = trpc.employees.getTimeSheet.useQuery({
    startDate,
    endDate,
  });

  const data = timesheetQuery.data;

  const filteredData = data?.filter(record =>
    `${record.employee.firstName} ${record.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center justify-start px-6">
        <h1 className="mr-6 text-3xl font-bold text-black-dark">Timesheet</h1>
        <div className="flex h-10 w-[473px] items-center rounded-3xl bg-white">
          <div
            className="ml-4 mr-[10px] h-[14px] w-[14px] bg-contain bg-no-repeat"
            style={{
              backgroundImage: `url(${SearchIcon})`,
            }}
          ></div>
          <input
            className="w-full rounded-3xl outline-none"
            placeholder="Search for an employee"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex h-14 items-end justify-end px-6">
        <div className="mr-3 flex h-10 w-[166px] items-center rounded-[8px] bg-white">
          <button
            onClick={() =>
              setDateInterval((prev) => ({
                startDate: addDays(prev.startDate, -7),
                endDate: addDays(prev.endDate, -7),
              }))
            }
            type="button"
            className="ml-[11px] h-[8px] w-[12px] bg-contain bg-no-repeat active:opacity-50"
            style={{
              backgroundImage: `url(${LeftArrowIcon})`,
            }}
          ></button>
          <div className="flex flex-1 justify-center text-blue">
            {format(startDate, "dd MMM")}-{format(endDate, "dd MMM")}
          </div>
          <button
            onClick={() =>
              setDateInterval((prev) => ({
                startDate: addDays(prev.startDate, 7),
                endDate: addDays(prev.endDate, 7),
              }))
            }
            className="mr-[11px] h-[8px] w-[12px] bg-contain bg-no-repeat active:opacity-50"
            style={{
              backgroundImage: `url(${RightArrowIcon})`,
            }}
          ></button>
        </div>
        <button
          onClick={() => {
            timesheetQuery.refetch();
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
      {timesheetQuery.isLoading && <div>Loading...</div>}
      {timesheetQuery.error && <div className="text-red">{timesheetQuery.error.message}</div>}
      {filteredData && (filteredData.length === 0 ? (
          <div>No employees found!</div>
        ) : (
          timesheetQuery.isSuccess && <TimeSheetTable startDate={startDate} data={filteredData} />
        ))}
    </div>
  );
}


function getDatesOfWeek(startDate: Date) {
  return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
}

type RouterOutput = inferRouterOutputs<AppRouter>;
type TimeSheetResponse = RouterOutput["employees"]["getTimeSheet"];
type EmployeeDate = RouterOutput["employees"]["getTimeSheet"][number]["dates"][number];

function TimeSheetTable(props: { data: TimeSheetResponse; startDate: Date }) {
  const { employee: currentUser } = useCurrentSession();
  const { data, startDate } = props;
  const dates = useMemo(() => getDatesOfWeek(startDate), [startDate]);

  return (
    <div className="min-h-0">
      <div className="h-full p-6">
        <div className="h-full rounded-md border">
          <Table wrapperClassName="h-full overflow-y-auto position-relative" className="h-full">
            <TableHeader>
              <TableRow className="sticky top-0 bg-white shadow">
                <TableHead className="text-blue">EMPLOYEE</TableHead>
                {dates.map((date) => (
                  <TableHead key={date.toString()}>
                    <div className="flex flex-col">
                      <span className="font-bold">{format(date, "dd MMM")}</span>
                      <span>{format(date, "EEE")}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
            {data.map((record) => {
              // Correcting the way to access the id property according to the new structure
              const isCurrentUser = record.employee.id === currentUser.details.id;
              return (
                <TableRow key={record.employee.id} className={`bg-white ${isCurrentUser ? "border-t-2 border-b-2 border-blue-500" : ""}`}>
                  <TableCell className={`font-bold ${isCurrentUser ? "bg-blue-500 text-white" : ""}`}>
                    {record.employee.firstName} {record.employee.lastName} {isCurrentUser ? "(You)" : ""}
                  </TableCell>
                  {dates.map((date, i) => (
                    <TableCell key={date.toString()}>
                      <TimeSheetCell value={record.dates[i]} />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function TimeSheetCell(props: { value: EmployeeDate }) {
  const { value } = props;
  const [icon, colorClass, iconClass] =
    value.type === "leave" && value.leavePolicy
      ? {
          "Annual Leave": [SunIcon, "text-purple", "h-[15.4px] w-[15px]"],
          "Sick Leave": [SickIcon, "text-yellow-dark", "h-[14px] w-[14px]"],
          "Remote Work": [HouseIcon, "text-blue", "h-[13px] w-[16px]"],
        }[value.leavePolicy.title] ?? []
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
      {value.type === "work" && "9 hrs"}
      {value.type === "leave" && value.leavePolicy?.title}
    </div>
  );
}
