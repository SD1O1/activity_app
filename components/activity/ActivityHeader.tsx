type Props = {
  title: string;
  type: "group" | "one-on-one";
  tags?: { id: string; name: string }[];
};

export default function ActivityHeader({ title, type, tags }: Props) {
  return (
    <section className="px-4 pt-6">
      <h1 className="max-w-3xl text-2xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-4xl">
        {title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-600">
          {type === "group" ? "Group activity" : "1-on-1 activity"}
        </span>

        {tags?.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full bg-neutral-200 px-4 py-1.5 text-sm font-medium text-neutral-700"
          >
            {tag.name}
          </span>
        ))}
      </div>
    </section>
  );
}
