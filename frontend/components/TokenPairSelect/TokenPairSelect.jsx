import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import { useContext } from "react";
import { EventContext } from "@/context/EventContext";
import { getTokenSymbolFromList } from "../../utils/tools"

export function TokenPairSelect({ label, value, onChange }) {
  const { tokenPairs, tokenList } = useContext(EventContext);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Select
        placeholder='Select token pair'
        onChange={handleChange}
        value={value}
      >
        {tokenPairs?.map((pair, index) => (
          <option key={index} value={pair.pairID}>
            {getTokenSymbolFromList(pair.tokenA, tokenList)} - {getTokenSymbolFromList(pair.tokenB, tokenList)}
          </option>
        ))}
      </Select>
    </FormControl>
  );
}
