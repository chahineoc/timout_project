import { db } from "../db";
import { leavePolicies } from "../db/schema";

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
