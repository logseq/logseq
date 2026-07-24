module Domain = Melange_db.Sqlite_policy

type encoded_edge = { address : int; children : int array }

type encoded_property_input = {
  namespaceValue : string;
  name : string;
  normalizedName : string;
  title : string Js.Nullable.t;
  propertyType : string;
  cardinality : string;
  explicitRefType : bool;
  knownRefType : bool;
  uuid : string;
  order : string;
}

type encoded_property_plan = {
  ident : string;
  title : string;
  normalizedName : string;
  propertyType : string;
  cardinality : string;
  refType : bool;
  uuid : string;
  order : string;
}

let sanitizeDbName prefix value = Domain.sanitize_db_name ~prefix value
let dbBasedGraph prefix value = Domain.db_based_graph ~prefix value

let dbBasedGraphNullable prefix value =
  value |> Js.Nullable.toOption
  |> Option.map (Domain.db_based_graph ~prefix)
  |> Js.Nullable.fromOption

let reachableAddresses roots edges =
  edges
  |> Array.map (fun (edge : encoded_edge) ->
      (edge.address, Rrbvec.of_array edge.children))
  |> Rrbvec.of_array
  |> Domain.reachable_addresses ~roots:(Rrbvec.of_array roots)
  |> Rrbvec.to_array

let unusedAddresses internal all referenced =
  Domain.unused_addresses ~internal:(Rrbvec.of_array internal)
    ~all:(Rrbvec.of_array all)
    ~referenced:(Rrbvec.of_array referenced)
  |> Rrbvec.to_array

let missingAddresses required present =
  Domain.missing_addresses ~required:(Rrbvec.of_array required)
    ~present:(Rrbvec.of_array present)
  |> Rrbvec.to_array

let property (input : encoded_property_input) =
  let plan =
    Domain.property
      {
        namespace_ = input.namespaceValue;
        name = input.name;
        normalized_name = input.normalizedName;
        title = Js.Nullable.toOption input.title;
        property_type = input.propertyType;
        cardinality = input.cardinality;
        explicit_ref_type = input.explicitRefType;
        known_ref_type = input.knownRefType;
        uuid = input.uuid;
        order = input.order;
      }
  in
  ({
     ident = plan.ident;
     title = plan.title;
     normalizedName = plan.normalized_name;
     propertyType = plan.property_type;
     cardinality = plan.cardinality;
     refType = plan.ref_type;
     uuid = plan.uuid;
     order = plan.order;
   }
    : encoded_property_plan)

let addRootExtends ident has_extends =
  Domain.add_root_extends ~ident ~has_extends

let hidePage title quick_add_title = Domain.hide_page ~title ~quick_add_title
let importRetractIdents = Rrbvec.to_array Domain.import_retract_idents
