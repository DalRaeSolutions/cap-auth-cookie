using { com.broadspectrum.demo as t } from '../db/schema';

service OrderService @(path: '/orders') {
  
  entity WorkOrders as projection on t.WorkOrders
}

// annotate OrderService.WorkOrders @(
//     restrict: [
//       { grant: ['READ', 'WRITE'], to: '*' }
//     ]
// );