import PageBreadcrumb from "../../components/common/PageBreadCrumb";

import TechnicienPage from "../../components/form/form-elements/Technicien";

export default function Technicien() {
  return (
    <div>
   
      <PageBreadcrumb pageTitle="Les Techniciens" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 ml-[3%] sm:ml-[25%] md:ml-[32%] xl:ml-[30%]">
      <div className="space-y-6">
          <TechnicienPage />
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
