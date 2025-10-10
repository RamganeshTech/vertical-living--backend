const fs = require('fs');


// Function to get unique categories, subcategories, models, and MRP range from the 447 products
function getInventoryFilters() {
	// Only consider the first 447 items (as per your request)
    const data = JSON.parse(fs.readFileSync('d:/jspider reactjs/CRM/CRM-BE/src/models/Material Inventory Model/materialinventJSON.json', 'utf8'));

	const items = data.items.slice(0, 447);
	const categories = new Set();
	const subcategories = new Set();
	const models = new Set();
	let minMrp = Infinity;
	let maxMrp = -Infinity;

	items.forEach(item => {
		if (item.category) categories.add(item.category);
		if (item.subcategory) subcategories.add(item.subcategory);
		if (item.model) models.add(item.model);
		if (typeof item.mrp === 'number') {
			if (item.mrp < minMrp) minMrp = item.mrp;
			if (item.mrp > maxMrp) maxMrp = item.mrp;
		}
	});

	return {
		categories: Array.from(categories),
		subcategories: Array.from(subcategories),
		models: Array.from(models),
		mrpRange: [minMrp === Infinity ? null : minMrp, maxMrp === -Infinity ? null : maxMrp]
	};
}

// Example usage:
const filters = getInventoryFilters();
console.log(filters);



// const fs = require('fs');
// const data = JSON.parse(fs.readFileSync('d:/jspider reactjs/CRM/CRM-BE/src/models/Material Inventory Model/Commericalidoor.json', 'utf8'));
const data = JSON.parse(fs.readFileSync('d:/jspider reactjs/CRM/CRM-BE/src/models/Material Inventory Model/materialinventJSON.json', 'utf8'));
const count = data.items.filter(item => item.series === "Commercial Indoor Series").length;
// const count = data.items.length;
console.log("Count:", count);

// const uniqueItemCodes = new Set();
// data.items.forEach(item => {
//   if (item.itemCode) {
//     uniqueItemCodes.add(item.itemCode);
//   }
// });

// console.log("Unique itemCode count:", uniqueItemCodes.size);



// to run this open power shell and the naviaget to this file 

// and then run <node filename.js>

// not sure chekc the path anyway while running
// cd "d:\jspider reactjs\CRM\CRM-BE\src\utils"
// node commercialIndoor.js