import { form } from 'form-nodes';

type Company = {
  companyId: number;
  companyName: string;
};

const defaultCompany: Company = {
  companyId: 23,
  companyName: 'Apple',
};

const myForm = form({
  name: '',
  age: null,
  siblings: 2,
  birthday: new Date('1990-06-15T00:00:00.000Z'),
  sister: undefined,
  address: {
    city: 'Zurich',
  },
  inlineCompany: {
    companyId: 7,
    companyName: 'Google',
  },
  company: defaultCompany,
  roles: ['admin'],
  recentCompanies: [defaultCompany],
});

myForm.name(); // string | null
myForm.age(); // unknown
myForm.siblings(); // number | null
myForm.birthday(); // Date | null
myForm.sister(); // unknown
myForm.address.city(); // string | null
myForm.company.companyId(); // number | null
myForm.roles(); // string[] | null
myForm.recentCompanies(); // Company[] | null
myForm.roles.nodeType() === 'field'; // true
myForm.recentCompanies.nodeType() === 'field'; // true
