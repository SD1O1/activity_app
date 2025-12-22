type DiscoveryCardProps = {
    title: string;
    subtitle: string;
  };
  
  export default function DiscoveryCard({
    title,
    subtitle,
  }: DiscoveryCardProps) {
    return (
      <div className="min-w-[220px] rounded-xl border p-4">
        <h4 className="font-semibold">{title}</h4>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
    );
  }  