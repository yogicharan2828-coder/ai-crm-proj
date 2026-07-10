export default function GlassCard({ title, value, icon }) {
  return (
    <div className="
      backdrop-blur-xl
      bg-white/10
      border
      border-white/20
      rounded-3xl
      p-6
      shadow-2xl
      hover:scale-105
      transition
      duration-300
    ">

      <div className="text-4xl">
        {icon}
      </div>

      <h2 className="text-lg mt-4 text-gray-300">
        {title}
      </h2>

      <h1 className="text-5xl font-bold mt-2">
        {value}
      </h1>

    </div>
  );
}