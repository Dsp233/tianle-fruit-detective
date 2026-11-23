  // Drafts may contain partial selections. Submissions must be complete.
  function validAnswer(question,value,complete=true){
   const type=question.type;
   if(extraTypes.has(type))return validExtraDraft(question,value,complete);
   if(type==='departure')return validDepartureAnswer(question,value);
   if(type==='route')return validRouteDraft(question,value,complete);
   if(type==='cargo')return validCargoDraft(question,value,complete);
   if(type==='match')return validMatchDraft(question,value,complete);
   const size=question.options.length,index=i=>Number.isInteger(i)&&i>=0&&i<size;
   if(type!=='order')return index(value);
   return Array.isArray(value)&&(complete?value.length===size:value.length<=size)
    &&new Set(value).size===value.length&&value.every(index);
  }
