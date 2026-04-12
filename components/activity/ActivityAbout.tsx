type Props = {
  description: string;
};

export default function ActivityAbout({ description }: Props) {
  return (
    <section className="mt-9 px-4 sm:px-5">
      <div className="rounded-3xl border border-orange-100/80 bg-white p-5 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.5)] sm:p-6">
        <h2 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">About this activity</h2>
        <p className="mt-3 max-w-3xl text-xl leading-relaxed text-slate-700 sm:text-2xl">{description}</p>
      </div>
    </section>
  );
}