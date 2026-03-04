type Props = {
  description: string;
};

export default function ActivityAbout({ description }: Props) {
  return (
    <section className="mt-9 px-4 sm:px-5">
      <h2 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-[2rem]">About this activity</h2>
      <p className="mt-3 max-w-3xl text-xl leading-relaxed text-slate-700 sm:text-2xl">{description}</p>
    </section>
  );
}
