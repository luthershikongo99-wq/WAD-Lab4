(() => {
  // ======= DOM ELEMENTS =======
  const form = document.getElementById('regForm');
  const cardsEl = document.getElementById('cards');
  const tbody = document.querySelector('#summary tbody');
  const clearBtn = document.getElementById('clearBtn');
  const successBox = document.getElementById('successBox');
  const successMessage = document.getElementById('successMessage');
  const okBtn = document.getElementById('okBtn');
  const searchBox = document.getElementById('searchBox');
  const emailInput = document.getElementById('email');
  const emailCount = document.getElementById('emailCount');
  const addBtn = form.querySelector("button[type='submit']");
  const STORAGE_KEY = 'lab4_profiles_v3'; // new version for storage

  let editMode = false;     // flag for edit
  let editingId = null;     // which student is being edited

  // ======= HELPERS =======
  function capWords(str){
    return str.split(" ").map(w => w ? w[0].toUpperCase()+w.slice(1).toLowerCase() : "").join(" ");
  }
  function validateEmail(val){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); }
  function showError(id,msg){ document.getElementById('err-'+id).textContent=msg||''; }
  function clearErrors(){ ['first','last','studentNo','email','prog','year'].forEach(id=>showError(id,'')); }
  function saveProfiles(profiles){ localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles)); }
  function loadProfiles(){ return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); }

  // ======= GET FORM DATA =======
  function getFormDataAndValidate(){
    clearErrors();
    const first=capWords(document.getElementById('first').value.trim());
    const last=capWords(document.getElementById('last').value.trim());
    const studentNo=document.getElementById('studentNo').value.trim();
    const email=emailInput.value.trim();
    const prog=document.getElementById('prog').value;
    const photoFile=document.getElementById('photo').files[0];
    const yearInput=document.querySelector('input[name="year"]:checked');
    const year=yearInput?yearInput.value:'';
    const interests=Array.from(document.querySelectorAll('input[name="interests"]:checked')).map(n=>n.value);

    let ok=true;
    if(!first){showError('first','First name required'); ok=false;}
    if(!last){showError('last','Last name required'); ok=false;}
    if(!studentNo){showError('studentNo','Student number required'); ok=false;}
    if(!email||!validateEmail(email)){showError('email','Valid email required'); ok=false;}
    if(!prog){showError('prog','Choose programme'); ok=false;}
    if(!year){showError('year','Select year'); ok=false;}
    if(!ok) return null;

    return {id:studentNo,first,last,studentNo,email,prog,year,interests,photoData:null,photoFile};
  }

  // ======= RENDER FUNCTIONS =======
  function renderCard(profile){
    const card=document.createElement('article');
    card.className='card-person';
    card.setAttribute('data-id',profile.id);

    const imgSrc=profile.photoData||'https://placehold.co/128x128?text=Photo';
    card.innerHTML=`
      <img alt="${profile.first} ${profile.last}" src="${imgSrc}" />
      <div style="flex:1;">
        <h3>${profile.first} ${profile.last}</h3>
        <p class="muted">Student No: ${profile.studentNo}</p>
        <p class="muted"><span class="badge">${profile.prog}</span> <span class="badge">Year ${profile.year}</span></p>
        <p class="muted">${profile.interests.join(', ')}</p>
      </div>
      <div>
        <button class="btn-edit" data-id="${profile.id}">Edit</button>
        <button class="btn-remove" data-id="${profile.id}">Remove</button>
      </div>`;
    cardsEl.prepend(card);
    setTimeout(()=>card.classList.add('show'),50);
  }

  function renderRow(profile){
    const tr=document.createElement('tr');
    tr.setAttribute('data-id',profile.id);
    tr.innerHTML=`
      <td>${profile.studentNo}</td>
      <td>${profile.first} ${profile.last}</td>
      <td>${profile.prog}</td>
      <td>Year ${profile.year}</td>
      <td>${profile.interests.join(', ')}</td>
      <td>
        <button class="btn-edit" data-id="${profile.id}">Edit</button>
        <button class="btn-remove" data-id="${profile.id}">Remove</button>
      </td>`;
    tbody.prepend(tr);
  }

  // Clear and rebuild a profile (after edit)
  function updateProfileInUI(profile){
    // Remove old elements
    removeProfileById(profile.id,false);
    // Re-render
    renderCard(profile);
    renderRow(profile);
  }

  // ======= ADD & REMOVE & EDIT =======
  function finalizeAdd(profile){
    if(editMode){
      // Editing existing profile
      const profiles=loadProfiles().filter(p=>p.id!==editingId);
      profiles.unshift(profile);
      saveProfiles(profiles);
      updateProfileInUI(profile);
      editMode=false;
      editingId=null;
      addBtn.textContent="Add Student";
    } else {
      // Adding new profile
      renderCard(profile); 
      renderRow(profile);
      const profiles=loadProfiles(); 
      profiles.unshift(profile); 
      saveProfiles(profiles);
    }

    form.reset();
    successMessage.textContent=`Student ${profile.first} ${profile.last} (${profile.studentNo}) saved successfully!`;
    successBox.classList.remove('hidden');
    setTimeout(()=>successBox.classList.add('hidden'),5000);
  }

  function removeProfileById(id,save=true){
    cardsEl.querySelector(`[data-id="${id}"]`)?.remove();
    tbody.querySelector(`tr[data-id="${id}"]`)?.remove();
    if(save){
      saveProfiles(loadProfiles().filter(p=>p.id!==id));
    }
  }

  // ======= EVENTS =======
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const profile=getFormDataAndValidate();
    if(!profile) return;

    if(profile.photoFile){
      const reader=new FileReader();
      reader.onload=ev=>{profile.photoData=ev.target.result; finalizeAdd(profile);};
      reader.readAsDataURL(profile.photoFile);
    } else {
      // Keep old photo if editing and no new one uploaded
      if(editMode){
        const old=loadProfiles().find(p=>p.id===editingId);
        if(old && old.photoData){profile.photoData=old.photoData;}
      }
      finalizeAdd(profile);
    }
  });

  clearBtn.addEventListener('click',()=>{form.reset(); clearErrors(); editMode=false; addBtn.textContent="Add Student";});
  document.addEventListener('click',e=>{
    const removeBtn=e.target.closest('.btn-remove'); 
    const editBtn=e.target.closest('.btn-edit'); 

    if(removeBtn) removeProfileById(removeBtn.dataset.id);

    if(editBtn){
      const id=editBtn.dataset.id;
      const profile=loadProfiles().find(p=>p.id===id);
      if(profile){
        // Fill form with existing data
        document.getElementById('first').value=profile.first;
        document.getElementById('last').value=profile.last;
        document.getElementById('studentNo').value=profile.studentNo;
        emailInput.value=profile.email;
        document.getElementById('prog').value=profile.prog;
        document.querySelectorAll('input[name="year"]').forEach(r=>r.checked=(r.value===profile.year));
        document.querySelectorAll('input[name="interests"]').forEach(c=>c.checked=profile.interests.includes(c.value));
        editMode=true;
        editingId=id;
        addBtn.textContent="Update Student";
        window.scrollTo({top:0,behavior:"smooth"});
      }
    }
  });

  okBtn.addEventListener('click',()=>successBox.classList.add('hidden'));
  emailInput.addEventListener('input',()=>{emailCount.textContent=`${emailInput.value.length} characters`;});

  searchBox.addEventListener('input',()=>{
    const q=searchBox.value.toLowerCase();
    document.querySelectorAll('.card-person').forEach(card=>{
      const text=card.textContent.toLowerCase();
      card.style.display=text.includes(q)?'flex':'none';
    });
    tbody.querySelectorAll('tr').forEach(row=>{
      const text=row.textContent.toLowerCase();
      row.style.display=text.includes(q)?'table-row':'none';
    });
  });

  // ======= RESTORE =======
  loadProfiles().forEach(p=>{renderCard(p); renderRow(p);});
})();
