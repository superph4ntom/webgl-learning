import { ChangeEvent } from "react";

type SingleInstrumentTypeProps = {
  value: string;
  label: string;
};

type SelectProps = {
  id: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<SingleInstrumentTypeProps> | Array<string>;
  disabled?: boolean;
  title?: string;
};

export default function Select({
  id,
  value,
  onChange,
  options,
  disabled = false,
  title = "",
}: SelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      title={disabled ? title : ""}
      className="w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2 disabled:cursor-not-allowed disabled:text-gray-500 transition"
    >
      {options.map((option: any) => {
        return (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        );
      })}
    </select>
  );
}
