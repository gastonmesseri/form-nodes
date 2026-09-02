/**
 * Type-erased terminal adapter accepted by Angular's `[formField]` directive.
 *
 * Angular's strict template checker must inspect its callable field-state contract. `any` avoids
 * publishing that Angular API as a supported application-code surface while allowing Angular to
 * perform the structural reads required to type-check native and custom controls.
 */
export type OpaqueAngularField = any;
