"use client";

import { useEffect, useState } from "react";

// "Hurry! Stock Of This Bundle As Of <today> Is Low": the date is the
// visitor's, filled in the browser (the page itself is cached on the CDN).
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// text: its words ("{date}" is "As Of November 5 " once the browser knows the date).
export function StockDate({ className, text = "Hurry! Stock Of This Bundle {date}Is Low" }: { className?: string; text?: string }) {
  const [date, setDate] = useState<string | null>(null);
  useEffect(() => {
    const d = new Date();
    setDate(`${MONTHS[d.getMonth()]} ${d.getDate()}`);
  }, []);
  return <div className={className}>{text.replace("{date}", date ? `As Of ${date} ` : "")}</div>;
}
