type Props = {
  title: string;
  type: "group" | "one-on-one";
  tags?: { id: string; name: string }[];
};

export default function ActivityHeader({ title, type, tags }: Props) {
  return (
    <section className="px-4 pt-4 sm:px-5">
      <div className="overflow-hidden rounded-3xl">
        <img
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80"
          alt="Activity cover"
          className="h-52 w-full object-cover sm:h-64"
        />
      </div>

      <h1 className="mt-5 max-w-3xl text-[2.1rem] font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
        {title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-600">
          {type === "group" ? "Social" : "1-on-1"}
        </span>

        {tags?.map((tag) => (
          <span key={tag.id} className="rounded-full bg-neutral-200 px-4 py-1.5 text-sm font-semibold text-slate-600">
            {tag.name}
          </span>
        ))}
      </div>
    </section>
  );
}
