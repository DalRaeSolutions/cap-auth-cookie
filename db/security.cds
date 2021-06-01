using {com.broadspectrum.demo as schema} from '../db/schema';

annotate schema.WorkOrders @(
    restrict: [
      { grant: ['READ', 'WRITE'], to: 'OrderUser', where: 'customer_ID like $user.customer' },
      { grant: ['READ', 'WRITE'], to: 'OrderAdmin' },
    ]
);