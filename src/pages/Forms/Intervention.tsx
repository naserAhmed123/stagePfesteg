import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DefaultInputs from "../../components/form/form-elements/Intervention";


export default function Intervention() {
  return (
    <div>
   
      <PageBreadcrumb pageTitle="Bureau Intervention" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 ml-[3%] sm:ml-[25%] md:ml-[32%] xl:ml-[30%]">
        <div className="space-y-6">
          <DefaultInputs />
          {/* <SelectInputs />
          <TextAreaInput />
          <InputStates /> */}
        </div>
        {/* <div className="space-y-6">
          <InputGroup />
          <FileInputExample />
          <CheckboxComponents />
          <RadioButtons />
          <ToggleSwitch />
          <DropzoneComponent />
        </div> */}
      </div>
    </div>
  );
}
