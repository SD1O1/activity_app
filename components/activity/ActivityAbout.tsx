type Props = {
    description: string;
  };
  
  export default function ActivityAbout({ description }: Props) {
    return (
      <section className="mt-6 px-4">
        <h2 className="text-sm font-semibold">About</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </section>
    );
  }  