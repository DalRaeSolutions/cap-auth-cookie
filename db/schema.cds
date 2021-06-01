using { managed, sap, cuid, sap.common.CodeList } from '@sap/cds/common';

namespace com.broadspectrum.demo;

entity WorkOrders : cuid, managed {
  description: String(100);
  startDate: Date;
  endDate: Date;
  customer: Association to Customers;
  items: Composition of many WorkOrderItems on items.order = $self
}

entity WorkOrderItems : cuid, managed {
  action: String(100);
  done: Boolean;
  order: Association to WorkOrders;
}

@cds.odata.valuelist
@sap.semantics : 'fixed-values'
entity Customers : cuid, managed {
  name: String(100);
  street: String(100);
  postcode: String(100);
  region: Association to States;
  country: String(100) default 'Australia';
  orders: Association to many WorkOrders on orders.customer = $self;
}

@cds.odata.valuelist
@sap.semantics : 'fixed-values'
entity States : sap.common.CodeList {
  key code : String(3);
}