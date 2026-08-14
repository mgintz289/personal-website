let metricsData, charitiesData;

// Off-screen canvas used to measure text width even when the element being
// measured sits inside a collapsed (display:none) ancestor — getBoundingClientRect
// returns 0 in that case, but canvas text metrics don't depend on layout at all.
const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d');
function measureTextWidth(text, el) {
  const cs = getComputedStyle(el);
  measureCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  return measureCtx.measureText(text).width;
}

async function loadAll() {
  try {
    const [metricsRes, charitiesRes] = await Promise.all([
      fetch('./metrics.json'),
      fetch('./charities.json')
    ]);
    metricsData = await metricsRes.json();
    charitiesData = await charitiesRes.json();
    buildWeightRows();
  } catch (error) {
    console.error("Could not load metrics/charities JSON:", error);
  }
}
loadAll();

function outcomeKey(category, subcategory, outcome) {
  return `${category};${subcategory};${outcome}`;
}

function buildWeightRows() {
  const container = document.getElementById('weights-container');
  container.innerHTML = '';

  const tree = {};
  metricsData.metrics.forEach(metric => {
    const cat = metric.Category;
    const sub = metric.Subcategory;
    if (!tree[cat]) {
        tree[cat] = {};
        tree[cat]["subcategories"] = {};
    }
    if (!tree[cat]["subcategories"][sub]) {
        tree[cat]["subcategories"][sub] = {};
        tree[cat]["subcategories"][sub]["outcomes"]=[];
    }
    tree[cat]["subcategories"][sub]["outcomes"].push(metric);
  });

  // Clears a preview grid container and rebuilds it with one <span> per item,
  // each showing "Outcome: total." — the grid CSS handles column layout.
function updatePreviewGrid(gridEl, items) {
  gridEl.innerHTML = '';
  
  items.forEach((item, index) => {
    // Insert a bullet point before every item EXCEPT the first one
    // if (index > 0) {
    //     const bullet = document.createTextNode('\u00A0\u00A0');
    // //   const bullet = document.createTextNode(' \u00B7 '); 
    //   gridEl.appendChild(bullet);
      
    //   // Alternatively, you can wrap the bullet in a span if you need to style it:
    //   // const bulletSpan = document.createElement('span');
    //   // bulletSpan.textContent = ' • ';
    //   // gridEl.appendChild(bulletSpan);
    // }

    const weightVal = parseFloat(item.input.value) || 0;
    const catVal = parseFloat(item.catMultiplier.value) || 0;
    const subVal = parseFloat(item.subMultiplier.value) || 0;
    const total = weightVal * catVal * subVal;
    
    const span = document.createElement('div');
    // span.style.display="inline";
    span.className="preview-bubble preview-item";
    // span.style.backgroundColor="#dbecff";
    // // span.style.lineHeight=1.6;
    // span.style.display="inline-block";
    // // span.style.padding="1em";
    // span.style.margin=".3em .6em .3em 0";
    // // span.style.height="1em";
    // // span.style.marginBottom=".3em";
    // span.style.borderRadius="999px";
    // span.className = 'preview-item';
    span.textContent = `\u00A0\u00A0${item.outcome} = ${total}\u00A0\u00A0`;
    
    gridEl.appendChild(span);
  });

    if (!items.length) {
      gridEl.style.gridTemplateColumns = '';
      return;
    }

    let maxWidth = 0;
    Array.from(gridEl.children).forEach(child => {
      const w = measureTextWidth(child.textContent, child);
      if (w > maxWidth) maxWidth = w;
    });

    gridEl.style.gridTemplateColumns = maxWidth > 0
      ? `repeat(auto-fill, ${Math.ceil(maxWidth)+25}px)`
      : '';
  }

  Object.keys(tree).forEach(cat => {
    const catGroup = document.createElement('div');
    catGroup.className = 'category-group';

    const catSummary = document.createElement('div');
    catSummary.className = 'category-summary';

    const catName = document.createElement('div');
    catName.style.display="inline";
    catName.className = 'category-name grid-col1';
    catName.textContent = cat;

    const catMultiplier = document.createElement('input');
    tree[cat].input=catMultiplier;
    tree[cat].inputChildren=[];
    catMultiplier.type = 'text';
    catMultiplier.inputMode = 'decimal';
    catMultiplier.className = 'category-multiplier grid-col2';
    catMultiplier.value = '1';
    catMultiplier.dataset.category = cat;
    catMultiplier.addEventListener('click', e => e.stopPropagation());
    restrictToDecimal(catMultiplier);

    catSummary.appendChild(catName);
    catSummary.appendChild(catMultiplier);
    catGroup.appendChild(catSummary);

    const catPreview = document.createElement('div');
    catPreview.className = 'preview-grid category-preview grid-fullrow';

    const catItems = []; // { sub, outcome, input, catMultiplier, subMultiplier } across all subcategories in this category
    tree[cat].previewEl = catPreview;
    tree[cat].items = catItems;

    const subList = document.createElement('div');
    subList.className = 'subcategory-list collapsed';

    catSummary.addEventListener('click', () => {
      const collapsed = subList.classList.toggle('collapsed');
      catGroup.classList.toggle('open', !collapsed);
      catMultiplier.classList.toggle('unfocused');
    });

    var sublistcount = 0;

    Object.keys(tree[cat]["subcategories"]).forEach(sub => {

      if (sublistcount>0) {
        const separator = document.createElement('div');
        separator.className = 'subcategory-separator grid-fullrow';
        subList.appendChild(separator);     
      }
      sublistcount++;

      const subGroup = document.createElement('div');
      subGroup.className = 'subcategory-group';

      const subSummary = document.createElement('div');
      subSummary.className = 'subcategory-summary';

      const subName = document.createElement('div');
      subName.style.display="inline";
      subName.className = 'subcategory-name grid-col1';
      subName.textContent = sub;

          const subMultiplier = document.createElement('input');
          tree[cat]["subcategories"][sub].input=subMultiplier;
          tree[cat]["subcategories"][sub].inputChildren=[];
          subMultiplier.type = 'text';
          subMultiplier.inputMode = 'decimal';
          subMultiplier.className = 'subcategory-multiplier grid-col2';
          subMultiplier.value = '1';
          subMultiplier.dataset.subcategory = sub;
          subMultiplier.dataset.category = cat;
          subMultiplier.addEventListener('click', e => e.stopPropagation());
          restrictToDecimal(subMultiplier);

        subSummary.appendChild(subName);
        subSummary.appendChild(subMultiplier);
        subGroup.appendChild(subSummary);

      const subPreview = document.createElement('div');
      subPreview.className = 'preview-grid subcategory-preview grid-fullrow';

      const subItems = []; // { outcome, input, catMultiplier, subMultiplier } for this subcategory only
      tree[cat]["subcategories"][sub].previewEl = subPreview;
      tree[cat]["subcategories"][sub].items = subItems;

      const outcomeContainer = document.createElement('div');
      outcomeContainer.className = 'outcome-list collapsed';

      subSummary.addEventListener('click', () => {
        const collapsed = outcomeContainer.classList.toggle('collapsed');
        subGroup.classList.toggle('open', !collapsed);


      });

      tree[cat]["subcategories"][sub]["outcomes"].forEach(metric => {
        const key = outcomeKey(metric.Category, metric.Subcategory, metric.Outcome);

        const row = document.createElement('div');
        row.className = 'weight-row';

        const labelWrap = document.createElement('div');
        labelWrap.className = 'weight-label grid-col1';

        const label = document.createElement('div');
        label.style.display="inline";
        label.textContent =metric.Outcome;
        label.className = "metric-dropdown-label";

        const description = document.createElement('div');
        description.style.display="inline";
        description.className = 'weight-description';
        description.textContent = metric.Description;

        labelWrap.appendChild(label);
        // labelWrap.appendChild(description);

        const input = document.createElement('input');
        metric.input = input;
        input.type = 'text';
        input.inputMode = 'decimal';
        input.value = metric["Default Weight"];
        input.className = 'weight-input grid-col2';
        input.dataset.outcome = key;
        restrictToDecimal(input);

        const myresult = document.createElement('input');
        myresult.Category = metric.Category;
        myresult.Subcategory = metric.Subcategory;
        myresult.Outcome = metric.Outcome;
        myresult.value="(Total: "+(metric["Default Weight"]*subMultiplier.value*catMultiplier.value)+")";
        myresult.style.width = "80px";
        myresult.style.overflow = "hidden";
        myresult.style.textOverflow = "ellipsis";
        myresult.style.background= "transparent";
        myresult.style.borderColor= "transparent";
        myresult.style.color= "black";
        myresult.style.outline="none";
        myresult.style.whiteSpace= "nowrap";
        myresult.disabled=true;
        tree[cat].inputChildren.push([input,myresult,subMultiplier]);
        tree[cat]["subcategories"][sub].inputChildren.push([input,myresult]);

        const itemRecord = { sub, outcome: metric.Outcome, input, catMultiplier, subMultiplier };
        subItems.push(itemRecord);
        catItems.push(itemRecord);

        input.addEventListener('input', (event) => {
        const currentValue = event.target.value;
        tree[cat]["subcategories"][sub].inputChildren.forEach((element, index, array) => {
            element[1].value="(Total: "+(tree[cat].input.value*tree[cat]["subcategories"][sub].input.value*element[0].value)+")";

        });
        updatePreviewGrid(subPreview, subItems);
        updatePreviewGrid(catPreview, catItems);
        });

        row.appendChild(labelWrap);
        row.appendChild(input);
        row.appendChild(myresult);
        outcomeContainer.appendChild(row);
      });

        subMultiplier.addEventListener('input', (event) => {
        const currentValue = event.target.value;
        tree[cat]["subcategories"][sub].inputChildren.forEach((element, index, array) => {
            element[1].value="(Total: "+(tree[cat].input.value*tree[cat]["subcategories"][sub].input.value*element[0].value)+")";

        });
        updatePreviewGrid(subPreview, subItems);
        updatePreviewGrid(catPreview, catItems);
        });

      subGroup.appendChild(outcomeContainer);
      subGroup.appendChild(subPreview);
      subList.appendChild(subGroup);

    //   updatePreviewGrid(subPreview, subItems);

    });

    catGroup.appendChild(subList);
    catGroup.appendChild(catPreview);
    // updatePreviewGrid(catPreview, catItems);



    container.appendChild(catGroup);
    const separator = document.createElement('div');
    separator.className = 'category-separator grid-fullrow';
    container.appendChild(separator);
    
    updatePreviewGrid(catPreview, catItems);
    Object.keys(tree[cat]["subcategories"]).forEach(subKey => {
      const subObj = tree[cat]["subcategories"][subKey];
      updatePreviewGrid(subObj.previewEl, subObj.items);
    });

    tree[cat].input.addEventListener('input', (event) => {
      const currentValue = event.target.value;
      tree[cat].inputChildren.forEach((element, index, array) => {
        element[1].value="(Total: "+(element[0].value*element[2].value*currentValue)+")";
      });

      // Refresh this category's own preview, plus every subcategory's preview beneath it
      updatePreviewGrid(tree[cat].previewEl, tree[cat].items);
      Object.keys(tree[cat]["subcategories"]).forEach(subKey => {
        const subObj = tree[cat]["subcategories"][subKey];
        updatePreviewGrid(subObj.previewEl, subObj.items);
      });
    });
  });
  container.style.setProperty('--col2-width', (container.querySelector('.grid-col2').getBoundingClientRect().width)+"px");

    // Select all elements with the class
    const elements = document.querySelectorAll('.preview-grid');

    // Loop through and apply the inline styles
    elements.forEach(element => {
        element.style.width="100%";
        // element.style.backgroundColor = 'yellow'; // Note camelCase for hyphenated properties
    });

  container.classList.remove('loading');


}

document.getElementById('calc-submit').addEventListener('click', function () {
  const weights = {};
  document.querySelectorAll('.weight-input').forEach(input => {
    weights[input.dataset.outcome] = parseFloat(input.value) || 0;
  });

  const multipliers = {};
  document.querySelectorAll('.category-multiplier').forEach(input => {
    multipliers[input.dataset.category] = parseFloat(input.value) || 0;
  });

  const subMultipliers = {};
  document.querySelectorAll('.subcategory-multiplier').forEach(input => {
    subMultipliers[`${input.dataset.category};${input.dataset.subcategory}`] = parseFloat(input.value) || 0;
  });

  const scored = charitiesData.charities.map(charity => {
    let score = 0;
    const lines = [];

    charity.metrics.forEach(m => {
      const key = outcomeKey(m.Category, m.Subcategory, m.Outcome);
      const weight = weights[key] || 0;
      const catMult = multipliers[m.Category] || 0;
      const subMult = subMultipliers[`${m.Category};${m.Subcategory}`] || 0;
      const value = parseFloat(m.Value) || 0;
      const contribution = value * weight * catMult * subMult;

      score += contribution;
      lines.push(`${m.Category} > ${m.Subcategory} > ${m.Outcome}: ${value} (${contribution})`);
    });

    return { name: charity.charity, score, lines };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  const resultsList = document.getElementById('results-list');
  resultsList.innerHTML = '';
  scored.forEach(c => {
    const li = document.createElement('li');

    const nameLine = document.createElement('div');
    nameLine.textContent = `${c.name}: ${c.score}`;
    li.appendChild(nameLine);

    c.lines.forEach(text => {
      const detail = document.createElement('div');
      detail.className = 'charity-detail-line';
      detail.textContent = text;
      li.appendChild(detail);
    });

    resultsList.appendChild(li);
  });

  document.getElementById('results').style.display = 'block';
});

function restrictToDecimal(input) {
  input.addEventListener('input', function () {
    let value = this.value.replace(/[^\d.]/g, '');
    const firstDot = value.indexOf('.');
    if (firstDot !== -1) {
      value = value.slice(0, firstDot + 1) + value.slice(firstDot + 1).replace(/\./g, '');
    }
    this.value = value;
  });
}
