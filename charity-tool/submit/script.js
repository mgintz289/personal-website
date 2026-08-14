let data;
const metricsContainer = document.getElementById("metrics-container");
const addMetricBtn = document.getElementById("new-metric");
const firstGroup = document.querySelector(".metric-group");

async function loadData() {
  try {
    const response = await fetch('./data.json');
    data = await response.json();
    populateCategories(firstGroup.querySelector(".category"));
    addMetricBtn.disabled = false;
    metricsContainer.classList.remove("loading");
  } catch (error) {
    console.error("Could not fetch the JSON file:", error);
  }
}
addMetricBtn.disabled = true;
loadData();

function populateCategories(catSelect) {
  for (const cat in data.level1) {
    const option = document.createElement("option");
    option.textContent = cat;
    catSelect.appendChild(option);
  }
}

// Shows "Remove charity" on every group once there are 2+ groups; hides it when only 1 remains
function updateRemoveButtons() {
  const groups = metricsContainer.querySelectorAll(".metric-group");
  groups.forEach(group => {
    const btn = group.querySelector(".remove-metric");
    btn.style.display = groups.length > 1 ? "inline-block" : "none";
  });
}

function wireUpGroup(group) {
  const catSelect = group.querySelector(".category");
  const subcatSelect = group.querySelector(".subcategory");
  const outcomeSelect = group.querySelector(".outcome");
  const removeBtn = group.querySelector(".remove-metric");

  catSelect.addEventListener("change", function () {
    const selectedCat = this.value;
    outcomeSelect.style.display = "none";
    outcomeSelect.innerHTML = '<option value="">(please select an outcome)</option>';

    if (selectedCat && data.level1[selectedCat]) {
      subcatSelect.style.display = "inline";
      subcatSelect.innerHTML = '<option value="">(please select a subcategory)</option>';
      data.level1[selectedCat].forEach(function (subcat) {
        const option = document.createElement("option");
        option.textContent = subcat;
        subcatSelect.appendChild(option);
      });
    } else {
      subcatSelect.style.display = "none";
      subcatSelect.innerHTML = '<option value="">(please select a subcategory)</option>';
    }
  });

  subcatSelect.addEventListener("change", function () {
    const selectedSubcat = this.value;
    if (selectedSubcat && data.level2[selectedSubcat]) {
      outcomeSelect.style.display = "inline";
      outcomeSelect.innerHTML = '<option value="">(please select an outcome)</option>';
      data.level2[selectedSubcat].forEach(function (outcome) {
        const option = document.createElement("option");
        option.textContent = outcome;
        outcomeSelect.appendChild(option);
      });
    } else {
      outcomeSelect.style.display = "none";
      outcomeSelect.innerHTML = '<option value="">(please select an outcome)</option>';
    }
  });

  removeBtn.addEventListener("click", function () {
    group.remove();
    updateRemoveButtons();
  });
}

wireUpGroup(firstGroup);

addMetricBtn.addEventListener("click", function () {
  const newGroup = firstGroup.cloneNode(true);

  newGroup.querySelectorAll("select").forEach(sel => sel.selectedIndex = 0);
  newGroup.querySelector(".metric-value").value = "";
  newGroup.querySelector(".metric-quotable").value = "";
  newGroup.querySelector(".metric-reasoning").value = "";
  newGroup.querySelector(".subcategory").style.display = "none";
  newGroup.querySelector(".outcome").style.display = "none";

  const clonedCat = newGroup.querySelector(".category");
  clonedCat.innerHTML = '<option value="">(please select a category)</option>';
  populateCategories(clonedCat);

  metricsContainer.appendChild(newGroup);
  wireUpGroup(newGroup);
  updateRemoveButtons();
});

function buildCharityData() {
  const charityName = document.getElementById("charityname").value;
  const linkToAnnualReport = document.getElementById("annualreport").value;
  const metrics = [];

  document.querySelectorAll(".metric-group").forEach(group => {
    const category = group.querySelector(".category").value;
    const subcategory = group.querySelector(".subcategory").value;
    const outcome = group.querySelector(".outcome").value;
    const actual = group.querySelector(".metric-type").value;
    const value = group.querySelector(".metric-value").value;
    const quotable = group.querySelector(".metric-quotable").value;
    const reasoning = group.querySelector(".metric-reasoning").value;

    metrics.push({
      Category: category,
      Subcategory: subcategory,
      Outcome: outcome,
      Actual: actual,
      Value: value,
      Quotable: quotable,
      Reasoning: reasoning
    });
  });

  return {
    Name: charityName,
    LinkToAnnualReport: linkToAnnualReport,
    metrics: metrics
  };
}

const url = 'https://script.google.com/macros/s/AKfycbyVg7rYwZkdikpNRjcakrN_1KfH068Fg4bwvk8hI5mMsVDEY_9gyPYgfdmul5QMx9i1/exec';

document.getElementById("button-submit").addEventListener("click", function (event) {
  event.preventDefault();

  const form = document.getElementById("locationForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const charityData = buildCharityData();

  fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(charityData)
  })
  .then(() => {
    console.log('Sent');
    resetForm();
  })
  .catch(error => console.error('Network error:', error));
});

function resetForm() {
  // Remove all metric groups except the first one
  const groups = metricsContainer.querySelectorAll(".metric-group");
  groups.forEach((group, index) => {
    if (index > 0) group.remove();
  });

  // Clear the remaining (first) group's fields
  const firstGroupNow = metricsContainer.querySelector(".metric-group");
  firstGroupNow.querySelector(".category").selectedIndex = 0;
  firstGroupNow.querySelector(".subcategory").selectedIndex = 0;
  firstGroupNow.querySelector(".subcategory").style.display = "none";
  firstGroupNow.querySelector(".outcome").selectedIndex = 0;
  firstGroupNow.querySelector(".outcome").style.display = "none";
  firstGroupNow.querySelector(".metric-type").selectedIndex = 0;
  firstGroupNow.querySelector(".metric-value").value = "";
  firstGroupNow.querySelector(".metric-quotable").value = "";
  firstGroupNow.querySelector(".metric-reasoning").value = "";

  // Clear charity name and annual report link
  document.getElementById("charityname").value = "";
  document.getElementById("annualreport").value = "";

  // Hide the remove button on the now-only group
  updateRemoveButtons();
}

// Run on page load, in case the browser restored old form values (e.g. bfcache, autofill)
window.addEventListener("DOMContentLoaded", resetForm);