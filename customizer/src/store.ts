import { proxy } from "valtio";

type RootState = {
  intro: boolean;
  colors: string[];
  decals: string[];
  selectedColor: string;
  selectedDecal: string;
};

const state = proxy<RootState>({
  intro: true,
  colors: ["#ccc", "#EFBD4E", "#80C670", "#726DE8", "#EF674E", "#353934"],
  decals: ["dogecoin", "ethereum"],
  selectedColor: "#EFBD4E",
  selectedDecal: "dogecoin",
});

export { state };
