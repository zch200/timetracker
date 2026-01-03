import { z } from "zod";

export const timeEntrySchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "时间格式错误 (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "时间格式错误 (HH:MM)"),
  activity: z.string().min(1, "事项不能为空").max(200, "事项过长"),
  categoryId: z.string().min(1, "请选择分类"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式错误"),
}).refine(data => data.endTime > data.startTime, {
  message: "结束时间必须晚于开始时间",
  path: ["endTime"],
});

export type TimeEntryFormValues = z.infer<typeof timeEntrySchema>;

