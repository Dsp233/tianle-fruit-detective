import copy,unittest
from apply_verified import apply_verified
class Tests(unittest.TestCase):
 def setUp(self):
  self.d={'pinyinTexts':{'行得通':['xíng','dé','tōng'],'旧书':['jiù','shū']}}
  self.legacy={'materials':[{'text':'旧书'}]}
  self.p={'contentHash':'reviewed','patches':[{'text':'行得通','position':1,'character':'得','old':'dé','new':'de'}],'unresolved':[],'blockedLegacyShared':[]}
 def test_pure_and_preserves_old(self):
  before=copy.deepcopy(self.d);out=apply_verified(self.d,self.legacy,self.p,'reviewed');self.assertEqual(out['行得通'][1],'de');self.assertEqual(self.d,before);self.assertEqual(out['旧书'],['jiù','shū'])
 def test_shared_refused(self):
  self.legacy['materials'].append({'text':'行得通'})
  with self.assertRaises(ValueError):apply_verified(self.d,self.legacy,self.p,'reviewed')
 def test_missing_old_and_conflicts_fail_closed(self):
  for change in ('missing','old','duplicate','unresolved','hash'):
   d=copy.deepcopy(self.d);p=copy.deepcopy(self.p)
   if change=='missing':del d['pinyinTexts']['行得通']
   if change=='old':d['pinyinTexts']['行得通'][1]='de'
   if change=='duplicate':p['patches'].append(copy.deepcopy(p['patches'][0]))
   if change=='unresolved':p['unresolved']=[{'text':'x'}]
   if change=='hash':p['contentHash']='different'
   with self.subTest(change=change),self.assertRaises(ValueError):apply_verified(d,self.legacy,p,'reviewed')
if __name__=='__main__':unittest.main()
