"""Pure, fail-closed exact-key pronunciation proposal application.

Caller must resolve edited-text projections before applying. No live storage.
"""
import copy

def walk(value):
 if isinstance(value,str):yield value
 elif isinstance(value,list):
  for item in value:yield from walk(item)
 elif isinstance(value,dict):
  for item in value.values():yield from walk(item)

def apply_verified(data, legacy, proposal, expected_proposal_hash):
 if proposal.get('contentHash')!=expected_proposal_hash:raise ValueError('Unexpected review baseline')
 if proposal.get('blockedLegacyShared') or proposal.get('unresolved'):raise ValueError('Proposal has unresolved or shared items')
 source=data['pinyinTexts']; oldtexts=set()
 for key in ('materials','diagnostics','weeks','lessons'):oldtexts.update(walk(legacy.get(key,{})))
 result=copy.deepcopy(source);seen=set()
 for row in proposal['patches']:
  text,pos,ch,before,after=(row[k] for k in ('text','position','character','old','new'))
  if text in oldtexts:raise ValueError('Legacy-shared exact text must not change')
  if not isinstance(pos,int) or text not in source or len(source[text])!=len(text) or not 0<=pos<len(text) or text[pos]!=ch:raise ValueError('Missing or edited reviewed key; remap and review explicitly')
  if source[text][pos]!=before:raise ValueError('Reviewed old reading differs')
  if (text,pos) in seen:raise ValueError('Duplicate patch position')
  seen.add((text,pos));result[text][pos]=after
 for text in oldtexts.intersection(source):
  if result[text]!=source[text]:raise ValueError('Historical pronunciation changed')
 return result
