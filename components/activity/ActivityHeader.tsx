type Props = {
  title: string;
  type: "group" | "one-on-one";
  tags?: { id: string; name: string }[];
};

export default function ActivityHeader({ title, type, tags }: Props) {
  return (
    <section className="px-4 pt-6">
      <h1 className="text-xl font-semibold">{title}</h1>

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span className="inline-block rounded-full border px-3 py-1 text-xs text-gray-600">
          {type === "group" ? "Group activity" : "One-on-one activity"}
        </span>

        {tags?.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
          >
            {tag.name}
          </span>
        ))}
      </div>
    </section>
  );
}