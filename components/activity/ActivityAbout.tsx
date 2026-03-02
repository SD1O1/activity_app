type Props = {
  description: string;
};

export default function ActivityAbout({ description }: Props) {
  return (
    <section className="mt-8 px-4">
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">About this activity</h2>
      <p className="mt-3 max-w-3xl text-lg leading-relaxed text-neutral-700 sm:text-xl">{description}</p>
    </section>
  );
}
