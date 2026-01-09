type Props = {
    startsAt: string;
    location: string;
    showLocation: boolean;
    costRule: string;
  };
  
  export default function ActivityMeta({
    startsAt,
    location,
    showLocation,
    costRule,
  }: Props) {
    return (
      <>
        <section className="mt-6 px-4 space-y-2 text-sm">
          <p>🕒 {new Date(startsAt).toLocaleString()}</p>
          <p>📍 {showLocation ? location : "Hidden"}</p>
        </section>
  
        <section className="mt-6 px-4">
          <h2 className="text-sm font-semibold">Expenses</h2>
          <p className="text-sm text-gray-600">
            {costRule === "everyone_pays" && "Everyone pays their own"}
            {costRule === "host_pays" && "Host covers it"}
            {costRule === "split" && "Split equally"}
          </p>
        </section>
      </>
    );
  }  