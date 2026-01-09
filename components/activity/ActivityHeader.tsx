type Props = {
    title: string;
    type: "group" | "one_on_one";
  };
  
  export default function ActivityHeader({ title, type }: Props) {
    return (
      <section className="px-4 pt-6">
        <h1 className="text-xl font-semibold">{title}</h1>
        <span className="mt-2 inline-block rounded-full border px-3 py-1 text-xs text-gray-600">
          {type === "group" ? "Group activity" : "One-on-one activity"}
        </span>
      </section>
    );
  }  