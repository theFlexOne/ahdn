import { createContext } from "react";
import type { FbClientContextValue } from "./fbClient.types";


const FbClientContext = createContext<FbClientContextValue | null>(null);

export default FbClientContext