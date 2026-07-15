import { Card } from "./Card";
import type { Exam, User } from "../types";

export const PDFPreview = ({ exam, user }: { exam: Exam; user: User }) => (
  <Card className="bg-white">
    <div className="border-b border-brand-100 pb-5">
      <div className="flex items-center gap-4">
        {user.logo ? <img src={user.logo} alt="Logo établissement" className="h-16 w-16 rounded-xl object-contain" /> : <div className="grid h-16 w-16 place-items-center rounded-xl border text-xs text-stone-500">Logo</div>}
        <div>
          <h2 className="text-2xl font-bold text-brand-900">{user.schoolName}</h2>
          <p className="text-sm text-stone-600">{user.city}</p>
          <p className="text-sm text-stone-600">{exam.subject} · {exam.level} · {exam.semester}</p>
        </div>
      </div>
    </div>
    <div className="pt-6">
      <h1 className="text-2xl font-bold text-ink">{exam.title}</h1>
      <p className="mt-2 text-sm text-stone-600">{exam.type} · Durée : {exam.duration}</p>
      <pre className="mt-6 whitespace-pre-wrap rounded-xl bg-brand-50 p-4 font-sans text-sm leading-7 text-ink">{exam.content}</pre>
      <div className="mt-5 rounded-xl border border-brand-100 p-4">
        <h3 className="font-bold text-brand-900">Barème</h3>
        <p className="mt-2 text-sm text-stone-700">{exam.bareme}</p>
      </div>
    </div>
  </Card>
);
