import { db } from "../db";
import { leavePolicies, holidays } from "../db/schema";
import { format, addDays } from "date-fns";
db.insert(leavePolicies)
  .values([
    {
      title: "Annual Leave",
      isUnlimited: false,
      allowedDaysPerYear: 15,
      id: 1,
    },
    {
      title: "Sick Leave",
      isUnlimited: false,
      allowedDaysPerYear: 15,
      id: 2,
    },
    {
      title: "Remote Work",
      isUnlimited: true,
      id: 3,
    },
  ])
  .onConflictDoNothing()
  .run();


  
  const thorsDay = addDays(new Date(), 5);  
  
  db.insert(holidays)
    .values({
      name: "Thor's Day",
      date: thorsDay,
    })
    .onConflictDoNothing()
    .run();
  