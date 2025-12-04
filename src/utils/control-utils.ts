export const getRatingColor = (rating: string): string => {
  switch (rating) {
    case "highly":
      return "bg-green-100 text-green-700";
    case "effective":
      return "bg-blue-100 text-blue-700";
    case "partially":
      return "bg-amber-100 text-amber-700";
    case "ineffective":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};
