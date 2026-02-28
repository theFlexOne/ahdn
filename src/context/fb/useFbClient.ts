import { useContext } from "react";
import FbClientContext from "./fbClientContext";

export default function useFbClient() {
  const context = useContext(FbClientContext);
  if (!context) {
    throw new Error('useFbClient must be used within FbClientProvider');
  }

  return context;
}
