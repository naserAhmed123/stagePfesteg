import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Select from "../Select";

export default function SelectInputs() {
  const options = [
    { value: "Equipe A", label: "Equipe A" },
    { value: "Equipe B", label: "Equipe B" },
  ];
  const handleSelectChange = (value: string) => {
    console.log("Selected value:", value);
  };


  return (
    <ComponentCard title="Select équipe de technicien">
      <div className="space-y-6">
        <div>
          <Label>Select équipe</Label>
          <Select
            options={options}
            placeholder="Select équipe"
            onChange={handleSelectChange}
            className="dark:bg-dark-900"
          />
        </div>
        {/* <div>
          <MultiSelect
            label="Multiple Select Options"
            options={multiOptions}
            defaultSelected={["1", "3"]}
            onChange={(values) => setSelectedValues(values)}
          />
          <p className="sr-only">
            Selected Values: {selectedValues.join(", ")}
          </p>
        </div> */}
      </div>
    </ComponentCard>
  );
}
