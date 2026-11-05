import Image from "next/image";

const MARK = "/brand/reschool-mark.png";
const LOCKUP_LIGHT = "/brand/reschool-light.png";
const LOCKUP_DARK = "/brand/reschool-dark.png";

/** Круглый знак (парта + цикл) — для дока и фавикона. */
export function BrandMark({
  className = "",
  title = "ReSchool",
  size = 48,
}: {
  className?: string;
  title?: string;
  size?: number;
}) {
  return (
    <Image
      src={MARK}
      alt={title}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      priority
    />
  );
}

/** Полный логотип со словом ReSchool — для шапки. */
export function BrandLockup({
  className = "",
  height = 36,
}: {
  className?: string;
  height?: number;
}) {
  const width = Math.round(height * 1.15);
  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <Image
        src={LOCKUP_LIGHT}
        alt="ReSchool"
        width={width}
        height={height}
        className="h-9 w-auto rounded-lg object-contain dark:hidden"
        priority
      />
      <Image
        src={LOCKUP_DARK}
        alt="ReSchool"
        width={width}
        height={height}
        className="hidden h-9 w-auto rounded-lg object-contain dark:block"
        priority
      />
    </span>
  );
}
