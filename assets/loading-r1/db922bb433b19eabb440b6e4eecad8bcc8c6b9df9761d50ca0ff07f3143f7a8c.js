'use strict';
// Second review cohort: route-specific strategies and independent variations.
const TeachingSkillContractsExtra=(()=>{
 function authored(use){
  const u=use,route=(nodes)=>({nodes}),method=(routeId,extras=[],more={})=>({routeId,extras,...more}),variation=(id,uses,solution)=>({id,uses,solution});
  const family=(routes,methods,variations)=>({revision:2,routes,methods,variations,reviewStatus:'DEVELOPER_REVIEW_NATIVE_AND_PEDAGOGICAL_ACCEPTANCE_PENDING'});
  const average=[u('D02.02','Convert an average and its actual group size into a total'),u('A02.04','Multiply the average by the group size')];
  const rectangle=[u('G01.02','The perimeter contains two copies of length plus width'),u('A02.05','Halve the perimeter to obtain the side sum')];
  const area=[u('G01.03','Count the rectangle area by rows of unit squares'),u('A02.04','Multiply the two side lengths')];
  const probability=[u('D03.04','Divide favorable equally likely identities by the specified sample size')];
  const shared=[u('C01.02','Distinguish a whole group, its only region and its shared region')];
  const recurrence=[u('L03.04','Use the explicit predecessor recurrence at each grid point'),u('L04.03','Read horizontal and vertical positions in the stated order')];
  const movement=[u('R03.02','Relate a distance to its speed and elapsed time')];
  const percent=[u('A04.05','Each percentage change uses its explicitly stated current base'),u('A04.03','Compute the percentage part of that base')];
  const subtractAverage=()=>({
   'all-total':average,'back-total':average,nonoverlap:[u('A02.01','Remove the entire back segment from the entire collection')],
   'front-total':average,target:[u('A02.01','Remove the nonoverlapping front portion to leave the shared position')]
  });
  const disjoint=(complement)=>({
   'only-red':[...shared,u('A02.01','Subtract shared people from the red group')],
   'only-blue':[...shared,u('A02.01','Subtract shared people from the blue group')],
   'region-total':[u('C01.03','Add the mutually exclusive only-red, only-blue and shared identities')],
   ...(complement?{neither:[u('C04.02','Remove the union from the specified whole population')]}:{}),target:probability
  });
  const sumSets=(complement)=>({attendance:[u('A02.01','Add the two membership counts')],
   union:[u('C01.05','Correct the one duplicated appearance of each shared identity')],
   ...(complement?{outside:[u('C04.02','Take the complement within the specified whole population')]}:{}),target:probability});
  const conditionalByRegions=[...shared,u('C01.03','Use three disjoint regions as the new at-least-one-group population'),...probability];
  const setVariant=variation('conditional-regions',conditionalByRegions,c=>{const m=c.math,total=m.red+m.blue-m.both;return `条件已缩到至少参加一组：只红${m.red-m.both}、只蓝${m.blue-m.both}、两组${m.both}，共${total}人。两组人数除以这个新整体，概率为${c.extension.answer}。`});
  return {
   fixedPerimeter:family({
    pairs:route({'half-perimeter':rectangle,'pair-*':[...area,u('C02.03','Visit each positive integer short side once, with the matching long side')],target:[u('A01.04','Compare every legal area to find the maximum')]}),
    'move-one':route({'half-perimeter':rectangle,'nearest-gap':[u('N01.05','An integer side sum permits a zero gap when even and a one-unit gap when odd'),u('S02.04','Moving one unit between sides preserves their sum while increasing area until the gap is minimal')],
     'short-side':[u('A02.05','Split the side sum into the closest legal integer sides'),u('N01.02','Preserve the possible one-unit remainder')],target:area})
   },[method('pairs'),method('move-one')],[
    variation('bounded-enumeration',[...rectangle,...area,u('C02.03','List every short side from the new minimum to half the side sum'),u('A01.04','Choose the minimum of the new legal areas')],c=>{const m=c.extension.problemState.math,values=[];for(let a=m.minSide;2*a<=m.halfPerimeter;a++)values.push(`${a}×${m.halfPerimeter-a}=${a*(m.halfPerimeter-a)}`);return `长宽和${m.halfPerimeter}，每边至少${m.minSide}。列全合法配对：${values.join('；')}。最小面积为${c.extension.answer}。`}),
    variation('bounded-side-move',[...rectangle,...area,u('S02.04','Moving sides toward each other increases area at fixed side sum'),u('A01.04','Reverse the objective and use the most unequal permitted sides')])
   ]),
   overlapAverages:family({
    'sum-overlap':route({'target-position':[u('A01.01','Identify the single common position of the two stated segments')],'front-total':average,'back-total':average,'all-total':average,
     multiplicity:[u('C01.05','The common position contributes twice in the two segment totals')],target:[u('A02.01','Subtract the whole total to leave one copy of the shared number')]}),
    'remove-nonoverlap':route(subtractAverage())
   },[method('sum-overlap'),method('remove-nonoverlap')],[
    variation('new-segment-removal',[...average,u('A02.01','Use two removals to isolate the new common position')],c=>{const m=c.extension.problemState.math,num=s=>String(s).split('/').map(Number).reduce((a,b)=>a/b),front=num(m.frontMean)*m.segmentSize,back=num(m.backMean)*m.segmentSize,all=num(m.allMean)*m.n;return `重叠位置改为第${m.middlePosition}个。全部总和${all}减后段${back}，得到前段不重叠总和${all-back}；前段总和${front}再减它，所求数为${c.extension.answer}。`}),
    variation('new-segment-deduplication',[...average,u('C01.05','The new segment totals duplicate exactly their shared position'),u('A02.01','Subtract the whole total from the segment sum')])
   ]),
   'natural-unionChance':family({'family-quantities':route(sumSets(false)),'disjoint-regions':route(disjoint(false))},[method('family-quantities'),method('disjoint-regions')],[setVariant]),
   'natural-complementChance':family({'family-quantities':route(sumSets(true)),'disjoint-regions':route(disjoint(true))},[method('family-quantities'),method('disjoint-regions')],[setVariant]),
   stepwiseRoute:family({
    'family-quantities':route({'decision-1':[u('D03.06','Different complete routes need not be equally likely under local choices'),u('L04.03','Read the named grid points')],
     'route-count':[u('C02.05','Pair the counted prefix and suffix routes through the specified point')],
     'decision-2':[u('D03.01','At a single legal exit that direction is certain')],
     target:[u('D03.06','Multiply local choice probabilities and combine mutually exclusive complete routes')]}),
    'probability-flow':route({'sampling-rule':[u('D03.06','The random object is a legal local exit, not an equiprobable complete route')],
     'boundary-rule':[u('D03.01','A unique legal exit has probability one')],
     'arrival-*':[...recurrence,u('D03.06','Send all or half of the incoming probability according to legal exits'),u('A03.04','Combine incoming fractions for mutually exclusive last steps')],
     target:[u('D03.06','The probability reaching P is the requested event probability')]})
   },[method('probability-flow',[],{useRouteFrames:true})],[variation('complete-route-pairing',[u('C02.05','Pair all counted routes before and after P'),...probability])]),
   routeProbability:family({
    'family-quantities':route({'decision-1':[u('D03.03','All complete routes are equally likely by the stated sampling rule')],
     'all-routes':[u('C02.03','Account for every legal complete route')],
     'allowed-routes':[u('C02.05','Pair prefixes and suffixes through P before removing those complete routes'),u('C04.02','Remove routes through P from the whole route population')],target:probability}),
    'direct-route-count':route({'sampling-rule':[u('D03.03','The probability denominator counts equally likely complete routes')],
     'all-routes':[...recurrence,u('C02.03','The unrestricted predecessor table counts all complete routes')],
     'ways-*':[...recurrence,u('A02.01','Add disjoint arrival counts; assign zero to the forbidden point')],target:probability})
   },[method('family-quantities'),method('direct-route-count')],[variation('first-up',[u('C02.03','Count completions after fixing the first step up'),...probability])]),
   'natural-catch':family({'lead-gap':route({lead:[...movement,u('A02.04','Multiply the early time by the slow speed')],
    'gap-speed':[u('R02.03','Compare speeds expressed in the same distance and time units'),u('A02.01','Subtract slow speed from fast speed')],target:[...movement,u('A02.05','Divide the lead by the per-minute gap reduction')]})},
   [method('lead-gap'),method('lead-gap',[u('L01.02','Represent the pursuit time as an unknown'),u('L01.03','Apply equal operations to the two distance expressions'),u('A02.06','Read the parenthesized total slow time in the equation')])],
   [variation('one-person-stops',[...movement,u('A02.04','After meeting, only the still-moving person adds distance')])]),
   riverTravel:family({'family-quantities':route({'down-speed':[u('A02.01','Add the same-direction boat and water speeds')],
    'up-speed':[u('A02.01','Subtract the opposite water speed')],'down-time':movement,'up-time':movement,
    target:[u('R03.03','Accumulate the times of the two separate travel segments'),u('A02.01','Add the two actual travel times')]})},[method('family-quantities')],
   [variation('still-water',[...movement,u('A02.04','Both legs use the same still-water speed')])]),
   percentRoundTrip:family({'family-quantities':route({raised:percent,'decision-1':[u('A04.05','The second percentage base is the raised price')],
    'final-price':percent,target:[u('A02.01','Compare the final price with the original price')]})},[method('family-quantities'),method('family-quantities')],
   [variation('restore-raised-price',[...percent,u('A04.01','The removed increase is a part of the raised-price whole'),u('A02.05','Compute that part relative to the raised price')])]),
   percentRestore:family({'family-quantities':route({'new-base':[...percent,u('A02.01','Use original price 100 and add the percentage increase')],
    difference:[u('A02.01','Find the difference from the unchanged original price')],target:[...percent,u('A04.01','Express the required decrease as a percentage of the raised whole')]})},[method('family-quantities')],
   [variation('restore-lowered-price',[...percent,u('A04.01','The restoring increase uses the lowered whole as its denominator')])]),
   equalDistanceSpeed:family({'family-quantities':route({'decision-1':[u('R02.01','An average speed divides the full distance by the full elapsed time')],
    'out-time':movement,'back-time':movement,target:[u('R03.03','Accumulate both actual distances and times'),u('A02.05','Divide total distance by total time')]})},
   [method('family-quantities'),method('family-quantities',[u('R01.02','Same distance gives the stated two-to-one time ratio'),u('D02.02','Weight the two speeds by their actual time shares'),u('A02.06','Evaluate the weighted numerator before division')])],
   [variation('equal-time-speed',[u('R03.02','The same elapsed time makes distance proportional to speed'),u('D02.02','Equal time weights permit the arithmetic mean of speeds')])]),
   fractionDifferentWholes:family({'family-quantities':route({'first-part':[u('A03.02','One fourth refers to the first box as its whole'),u('A02.05','Divide only the first box into four equal parts')],
    'second-part':[u('A03.02','One third refers to the second box as a different whole'),u('A02.05','Divide only the second box into three equal parts')],
    target:[u('A02.01','Add the two quantities after applying their separate wholes')]})},[method('family-quantities')],
   [variation('both-remainders',[u('A03.02','Preserve the two separate fractional wholes'),u('A02.05','Determine each used unit fraction'),u('A02.01','Subtract the used amounts from their separate whole quantities')])])
  };
 }
 function cohortThree(use){
  const u=use,route=nodes=>({nodes}),method=(routeId,extras=[])=>({routeId,extras}),variation=(id,uses,solution)=>({id,uses,solution});
  const family=(nodes,methods,variations,alternatives={})=>({revision:2,routes:{'family-quantities':route(nodes),...alternatives},methods,variations,reviewStatus:'DEVELOPER_REVIEW_NATIVE_AND_PEDAGOGICAL_ACCEPTANCE_PENDING'});
  const add=[u('A02.01','Add or remove the stated quantities')],multiply=[u('A02.04','Count equal groups by multiplication')],divide=[u('A02.05','Divide the whole into the specified equal groups')];
  const average=[u('D02.02','Average is the actual total divided by the actual group size')];
  const ratio=[u('R01.02','Keep the two named ratio quantities in their stated order')],parts=[u('R01.03','Relate the sum of ratio parts to the combined whole')];
  const enumUses=[u('C02.03','Visit every bounded whole-package candidate, including zero')],costUses=[...multiply,...add];
  const minimum=[u('A01.04','Compare all legal costs to choose the minimum')];
  const chart=[u('D01.03','Use the equally spaced chart scale'),u('D01.04','Read the actual column heights')];
  const cube=[u('G07.01','Distinguish cube faces, edges and vertices')],chance=[u('D03.04','Divide favorable equally likely individual cubes by the stated population')];
  const weightedNodes={'people-parts':[...ratio,...parts,...add],'red-total':[...ratio,...multiply],'blue-total':[...ratio,...multiply],target:[...average,...add,...divide]};
  const weightedAlt={'score-gap':add,'extra-total':[...ratio,...multiply],'people-parts':[...parts,...add],'extra-average':[...average,...divide],target:add};
  const weightedVariation=variation('swapped-population-weights',[...ratio,...parts,...average,...multiply,...add,...divide]);
  const joinNodes={joins:[u('A01.01','Match each connection to an adjacent pair, including the final pair only in a closed loop'),...add],'overlap-total':multiply,target:[u('C01.05','Subtract each duplicated connection length exactly once'),...multiply,...add]};
  const joinForward=[u('A01.01','Match connections to the changed open or closed arrangement'),u('C01.05','Remove the duplicated overlap length exactly once'),...multiply,...add];
  const postsNodes={intervals:divide,'decision-1':[u('S02.01','Apply the stated rule to both endpoints')],target:[u('A01.01','Match intervals to marks using the stated endpoint inclusion'),...add]};
  const postsVariation=[...divide,u('A01.01','Match intervals and marks after changing both endpoint rules'),u('S02.01','Check both endpoint conditions'),...add];
  const rectangle=[u('G01.02','A rectangle boundary has two lengths and two widths')];
  const fractionWhole=[u('A03.02','Identify a unit fraction relative to its stated whole')];
  const remainingWhole=[...fractionWhole,u('A03.07','Track the new whole for the next fraction operation')];
  return {
   squareBorder:family({'outer-side':add,'all-cells':[u('G01.03','Cover the enlarged square by rows of unit cells'),...multiply],'old-cells':[u('G01.03','Count the original square cells'),...multiply],target:add},
    [method('family-quantities'),method('boundary-strips')],[variation('left-and-top',[u('C01.03','Count the two disjoint added strips and the single outer corner'),...multiply,...add])],
    {'boundary-strips':route({'outer-side':add,'top-bottom':[u('A01.01','Count the added top and bottom cell rows'),...multiply],'left-right':[u('A01.01','Count side cells without recounting corner cells'),...multiply],target:[u('C01.03','Add four mutually exclusive strips')]})}),
   packPrice:family({'decision-1':[u('S02.01','Preserve the exact requested quantity and whole-package restriction')],'cost-*':[...enumUses,...costUses],target:minimum},[method('family-quantities')],[variation('allow-surplus',[...enumUses,...costUses,...minimum,u('S02.01','Check the new at-least quantity boundary')])]),
   mixedPacks:family({'decision-1':[u('S02.01','Use exact quantity with two indivisible package types')],'cost-*':[...enumUses,u('N01.02','Keep only package pairs that fill the exact quantity'),...costUses],target:minimum},[method('family-quantities')],[variation('allow-surplus',[...enumUses,...costUses,...minimum,u('S02.01','Check every bounded pair that buys at least the requested quantity')])]),
   paintedCube:family({'decision-1':cube,'one-edge':[...cube,...add],'all-edges':cube,'two-painted':multiply,target:[u('A01.01','Count individual qualifying small cubes')]},
    [method('family-quantities'),method('face-deduplication')],[variation('opposite-painted-faces',[u('G07.04','The top and bottom are opposite faces with disjoint layers'),u('G01.03','Count every cell of both full face layers'),...multiply])],
    {'face-deduplication':route({'one-face':[...cube,...multiply,...add],'six-faces':multiply,multiplicity:[u('C01.05','An edge cube appears in exactly two face counts')],target:[u('C01.05','Remove the double count of the same cubes'),...divide]})}),
   cubeProbability:family({'decision-1':cube,'one-edge':[...cube,...add],'all-edges':cube,'two-painted':multiply,target:[...chance,u('G07.05','The complete cube population has three independent layer dimensions'),...multiply]},
    [method('family-quantities'),method('face-deduplication')],[variation('condition-on-painted',[...cube,u('G07.05','Count all cubes and the internal unpainted cube'),u('C04.02','Use the painted outer layer as the new sample population'),...chance,...multiply,...add])],
    {'face-deduplication':route({'one-face':[...cube,...multiply,...add],'six-faces':multiply,multiplicity:[u('C01.05','Every noncorner edge cube is counted in two faces')],'two-painted':[u('C01.05','Deduplicate individual edge cubes'),...divide],'all-cubes':[u('G07.05','Count the full three-dimensional cube population'),...multiply],target:chance})}),
   chartScale:family({unit:[...chart,...divide],'B-count':[...chart,...multiply],target:[...chart,...multiply,...add]},[method('family-quantities'),method('proportional-heights')],
    [variation('three-extra-grid-steps',[...chart,...divide,...multiply])],{'proportional-heights':route({'combined-height':[...chart,...add],'height-ratio':[...ratio,...divide],target:[...multiply]})}),
   missingAverage:family({'whole-total':[...average,...multiply],'remaining-total':[...average,...multiply],target:add},[method('family-quantities'),method('deviation-balance')],
    [variation('omitted-value-twice',[...average,...multiply,...add,...divide])],{'deviation-balance':route({'mean-gap':add,'remaining-deviation':[...average,...multiply],target:[u('D02.01','The omitted value balances the sum of deviations from the original mean'),...add]})}),
   foldHoles:family({'inside-copies':[u('S01.05','Trace an interior hole through both folds')],'edge-copies':[u('S01.05','A hole on one fold has only two distinct unfolded positions')],'center-copies':[u('S01.05','The intersection of both folds has one unfolded position')],target:[u('C01.03','Combine the disjoint position categories'),...multiply,...add]},
    [method('family-quantities'),method('family-quantities',[u('S01.02','Trace the two successive mirror operations')])],[variation('edge-hole-moves-inward',[u('S01.05','Changing position changes that hole from two to four copies'),...multiply,...add])]),
   'natural-weighted':family(weightedNodes,[method('family-quantities'),method('baseline-difference')],[weightedVariation],{'baseline-difference':route(weightedAlt)}),
   'natural-fractionWeighted':family(weightedNodes,[method('family-quantities'),method('baseline-difference')],[weightedVariation],{'baseline-difference':route(weightedAlt)}),
   'natural-tiles':family({'largest-side':[u('N03.04','The largest uncut square side is the greatest common divisor of both lengths')],'along-width':divide,'along-height':divide,target:[u('G01.03','Cover the rectangle by complete square tiles'),...multiply]},[method('family-quantities')],[
    variation('retile-doubled-dimensions',[u('N03.04','Recompute the greatest common divisor of the two doubled dimensions'),u('G01.03','Count rows and columns of the new whole tiles'),...multiply,...divide],c=>`新地面为${2*c.math.w}×${2*c.math.h}，最大整数砖边长为${2*c.math.side}。两边分别铺${c.math.w/c.math.side}与${c.math.h/c.math.side}块，合计${c.extension.answer}块。`),
    variation('length-and-area-scaling',[u('N03.04','Doubling both integer lengths doubles their greatest common divisor'),u('R04.03','Ground area and tile area both become four times their original areas'),...divide])]),
   'natural-angleRatio':family({parts:[...parts,...add],'one-angle-part':[u('G02.03','The three triangle interior angles sum to 180 degrees'),...divide],target:[...ratio,...multiply,u('A01.04','Select the largest ratio part')]},[method('family-quantities')],
    [variation('quadrilateral-angle-parts',[...parts,...ratio,u('G02.04','Split a quadrilateral into two triangles to obtain 360 degrees'),u('A01.04','Select the smallest angle part'),...add,...divide,...multiply])]),
   digitInsert:family({positions:[u('C02.03','List all three insertions while preserving the two original digits in order')],target:[u('A01.02','Use decimal place values of the inserted digits'),u('A01.04','Compare all legal three-digit numbers')]},[method('family-quantities')],[variation('minimum-insertion',[u('C02.03','Keep the same complete set of legal insertions'),u('A01.02','Respect positional values'),u('A01.04','Reverse the objective to minimum')])]),
   numberAppend:family({coefficient:[u('A01.02','Appending a digit shifts each original place one position to the left')],'net-factor':[...add],target:[u('A02.03','Undo the appended digit and the ninefold change'),...divide]},[method('family-quantities')],[variation('prefix-digit',[u('A01.02','Prefixing a digit adds exactly that many hundreds'),...multiply])]),
   pairedSum:family({'pair-total':add,target:[u('S02.04','Reversing the sequence preserves its total, so two copies can be paired'),...multiply,...divide]},[method('family-quantities')],[variation('only-even-terms',[u('N01.05','Retain exactly the even terms'),u('S02.04','Pair the retained arithmetic sequence'),...add,...multiply,...divide])]),
   telescopingDifferences:family({'decision-1':[u('A02.03','Each interior quantity is added and removed once')],first:[u('A01.01','Identify the first endpoint')],last:[u('A01.01','Identify the last endpoint')],target:add},[method('family-quantities'),method('equal-differences')],
    [variation('omit-first-difference',[u('A02.03','Interior additions and removals still cancel after removing the first bracket'),...add])],{'equal-differences':route({gap:[u('L03.02','Every displayed consecutive difference is the same'),...add],terms:[u('L03.02','Count all equal gaps between the actual endpoints'),...divide],target:multiply})}),
   neighborProducts:family({square:multiply,neighbors:multiply,target:add},[method('family-quantities',[u('A02.06','Read the grouped product decomposition in its stated order')]),method('family-quantities')],[variation('offset-two',[...multiply,...add])]),
   ratioTotal:family({parts:[...parts,...add],'one-part':[u('R01.05','Recover a unit share from the combined total'),...divide],target:[...ratio,...multiply]},[method('family-quantities')],[variation('equalize-by-addition',[...ratio,u('R01.05','Use the same original unit share'),...multiply,...add])]),
   linkedRatios:family({green:[...ratio],blue:[...ratio,u('R01.05','Recover the same blue quantity from the blue-to-green ratio'),...multiply,...divide],red:[...ratio,u('R01.05','Use that blue quantity in the red-to-blue ratio'),...multiply,...divide],target:add},
    [method('family-quantities',[u('R01.04','Rescale both ratios to the same blue share')]),method('family-quantities')],[variation('red-catches-blue',[...ratio,u('R01.05','Recover the same named quantities before equalizing'),...multiply,...divide,...add])]),
   unitConversion:family({millilitres:[u('R02.03','Write both capacity amounts in the same stated unit'),...multiply],target:[u('R02.03','Only divide capacity amounts after unifying their units'),...divide,u('N01.02','Count full cups without a fractional cup')]},[method('family-quantities')],[variation('double-cup-volume',[u('R02.03','Preserve equal capacity units'),...multiply,...divide,u('N01.02','Count only complete doubled cups')])]),
   mapScale:family({'same-length-factor':[u('R04.02','Corresponding map lengths change by the same linear factor')],target:[u('R04.02','Apply the given factor to this same route'),...multiply]},[method('family-quantities')],[variation('halve-current-map',[u('R04.02','Keep the corresponding route under scaling'),...fractionWhole,...multiply,...divide])]),
   'rule-join-open':family(joinNodes,[method('family-quantities')],[variation('closed-loop',joinForward)]),
   'rule-join-closed':family(joinNodes,[method('family-quantities')],[variation('open-chain',joinForward)]),
   'rule-join-piece':family({...joinNodes,target:[u('C01.05','Restore the duplicated connection lengths'),u('A02.03','Undo the connection subtraction'),...add,...divide]},[method('family-quantities')],[variation('closed-loop',joinForward)]),
   'rule-posts-both':family(postsNodes,[method('family-quantities')],[variation('exclude-both-endpoints',postsVariation)]),
   'rule-posts-neither':family(postsNodes,[method('family-quantities')],[variation('include-both-endpoints',postsVariation)]),
   'rule-weighted-mean':family({'count-parts':[...ratio,...parts,...add],'A-score':[...ratio,...multiply],'B-score':[...ratio,...multiply],target:[...average,...add,...divide]},[method('family-quantities')],[variation('recover-A-score',[...ratio,...average,...multiply,...add,...divide])]),
   'rule-weighted-score':family({'total-score':[...ratio,...average,...multiply],'B-score':[...ratio,...multiply],'A-total':add,target:[...ratio,...divide]},[method('family-quantities')],[variation('find-combined-average',[...ratio,...parts,...average,...multiply,...add,...divide])]),
   'rule-ratio-length':family({half:[...rectangle,...divide],parts:[...parts,...add],one:[u('R01.05','Recover one length part from the known side sum'),...divide],target:[...ratio,...multiply]},[method('family-quantities')],[variation('find-perimeter-from-width',[...rectangle,...ratio,u('R01.05','Use the specified width to recover a unit part'),...add,...multiply,...divide])]),
   'rule-ratio-perimeter':family({one:[u('R01.05','Recover a unit length part from the known width'),...divide],length:[...ratio,...multiply],target:[...rectangle,...multiply,...add]},[method('family-quantities')],[variation('find-length-from-perimeter',[...rectangle,...ratio,...parts,u('R01.05','Recover a unit part from half the perimeter'),...add,...multiply,...divide])]),
   'rule-fraction-reverse':family({'decision-1':remainingWhole,'after-first':[...remainingWhole,u('A03.04','Use the exact retained fraction'),...multiply,...divide],target:[...fractionWhole,u('A03.04','Restore the original retained fraction'),...multiply,...divide]},[method('family-quantities')],[variation('second-whole-is-first-use',[...remainingWhole,...multiply,...divide,...add])]),
   'rule-fraction-original':family({'decision-1':[...fractionWhole],'first-use':[...fractionWhole,...divide],'second-use':[...fractionWhole,...divide],target:add},[method('family-quantities')],[variation('reverse-two-remainders',[...remainingWhole,u('A03.04','Undo the two exact retained fractions'),...multiply,...divide])]),
   'rule-packs-exact':family({'decision-1':[u('S02.01','Packages remain indivisible and requested quantity is exact')],'cost-*':[...enumUses,...costUses],target:minimum},[method('family-quantities')],[variation('allow-surplus',[...enumUses,...costUses,...minimum,u('S02.01','Include the first whole-package purchase that exceeds the requested quantity')])])
  };
 }
 function cohortFour(use){
  const u=use,route=nodes=>({nodes}),method=(routeId='family-quantities',extras=[],more={})=>({routeId,extras,...more}),variation=(id,uses,solution)=>({id,uses,solution});
  const family=(nodes,methods,variations,alternatives={},routeId='family-quantities')=>({revision:2,routes:{[routeId]:route(nodes),...alternatives},methods,variations,reviewStatus:'DEVELOPER_REVIEW_NATIVE_AND_PEDAGOGICAL_ACCEPTANCE_PENDING'});
  const add=[u('A02.01','Add or remove the stated quantities')],mul=[u('A02.04','Count equal groups by multiplication')],div=[u('A02.05','Divide into the stated equal groups')],inverse=[u('A02.03','Undo the stated addition or removal')];
  const order=[u('A02.06','Respect the stated sequence and grouping of operations')],position=[u('A01.02','Use the decimal place value of each digit')],digits=[u('A01.03','Keep tens and units as ordered positions')];
  const remainder=[u('N01.02','Check the remainder after actual integer division')],enumerate=[u('C02.03','Visit every bounded legal integer candidate')],compare=[u('A01.04','Compare all legal results against the stated objective')];
  const area=[u('G01.03','Cover the rectangle by unit square rows'),...mul],boundary=[u('G01.02','Trace the actual exterior boundary'),...add];
  const angle=[u('G02.02','Use a complete turn of 360 degrees or a straight angle of 180 degrees')];
  const pythagoras=[u('G06.03','Recover the requested side from the stated right triangle')],similar=[u('G05.02','The stated corresponding figures have equal length ratios')];
  const percent=[u('A04.03','Compute the specified percentage of its base'),u('A04.05','Keep the percentage base at the specified operation stage')];
  const digitNodes={'decision-1':[u('C03.01','Exchanging tens and units can produce a different number'),...digits],'first-*':[u('C02.01','Partition legal numbers by their tens digit'),u('N01.03','Divisibility by three follows the sum of the two digits'),...enumerate],target:[u('C01.03','Add mutually exclusive tens-digit groups')]};
  const digitGrouped={'group-0':remainder,'group-1':remainder,'group-2':remainder,'pairs-00':[u('C02.05','Pair two zero-remainder digits, respecting repetition and ordered positions'),...mul,...add],'pairs-12':[u('C02.05','The tens remainder one pairs with units remainder two'),...mul],'pairs-21':[u('C02.05','The reverse ordered remainder pair is a separate branch'),...mul],target:[u('C01.03','Combine the three disjoint ordered remainder branches'),u('C03.01','Keep the two digit positions ordered'),u('N01.03','The taught divisibility-by-three rule makes exactly these digit-remainder pairs legal'),...digits]};
  const digitVariation=[...digits,u('C03.01','The two digit positions remain ordered'),u('N01.03','Test divisibility by three for each ordered digit pair'),...enumerate];
  const unknownRule=(id,reason)=>({unverifiedKnowledge:[{id,reason}]});
  return {
   reverseDigits:family({'digit-gap':[...position,...div],'smaller-digit':[...add,...div],'larger-digit':[...add,...div],target:[...digits,...mul,...add]},[method('family-quantities',order),method('digit-pairs')],
    [variation('smaller-swapped-number',[...position,...digits,...add,...mul,...div])],{'digit-pairs':route({'candidate-count':[...digits,...enumerate,...add],target:[...position,...digits,...compare]})}),
   divisibleDigits:family({'decision-1':[u('N01.03','The taught divisibility-by-five rule restricts the last digit to zero or five')],'candidate-count':[...enumerate,...remainder,...digits],target:[...compare,...position]},
    [method('family-quantities',[],unknownRule('digit-sum-divisibility-nine','The current N01.03 lesson teaches two, three and five; its declared coverage does not establish the digit-sum rule for nine')),method()],
    [variation('divisible-nine-and-even',[u('N01.03','Use the taught even last-digit condition'),...enumerate,...remainder,...position,...compare])]),
   lastDigit:family({'cycle-size':[u('N04.05','Establish the last-digit multiplication cycle'),...mul,...remainder],position:[u('N04.03','Align an exponent counted from one with its cycle position'),u('N04.06','A zero remainder uses the final cycle position')],target:[u('N04.05','Read the last digit at the computed cycle position')]},[method()],
    [variation('sum-neighboring-powers',[u('N04.05','Locate the last digits of the two adjacent powers'),u('N04.03','Preserve exponent positions'),...add,...remainder])]),
   'natural-digitCount':family(digitNodes,[method(),method('remainder-groups')],[variation('forbid-repetition',digitVariation)],{'remainder-groups':route(digitGrouped)}),
   'natural-distinctDigitCount':family(digitNodes,[method(),method('remainder-groups')],[variation('allow-repetition',digitVariation)],{'remainder-groups':route(digitGrouped)}),
   squareBounds:family({'lower-square':[u('A05.04','Compare positive integer square values'),u('A05.05','The positive square root lies above this integer'),...compare],'upper-square':[u('A05.04','Check the next integer square'),...add],target:[u('A05.05','Locate the root between the two consecutive integers')]},[method()],
    [variation('right-integer-bound',[u('A05.05','The nonsquare input makes the upper integer strictly above the root'),u('A05.04','Verify the neighboring squares'),...add,...compare])]),
   ageDifference:family({gap:[u('S02.04','Equal elapsed time preserves the age difference'),...add],'past-child':[u('R01.05','A three-to-one age relation makes the fixed difference two child-age parts'),...div],target:[...add]},[method()],
    [variation('future-two-to-one',[u('S02.04','The age difference remains unchanged'),u('R01.05','At a two-to-one ratio the child age equals that difference'),...add])]),
   repeatedMachine:family({'undo-final-add':[u('L02.01','Reverse the final operation of the two-stage machine'),...inverse],'undo-second':[u('L02.01','Undo the second multiplication'),...div],target:[u('L02.01','Continue the reverse sequence through the first machine use'),...inverse,...div]},
    [method(),method('family-quantities',[u('L01.02','Represent the original input as one unknown'),u('L01.03','Apply equal inverse operations to the full two-use equation'),...mul,...order])],[variation('add-then-multiply',[...order,...add,...mul])]),
   twoCoins:family({baseline:[u('A01.01','Match one unit of value to each actual coin')],excess:add,target:[u('A01.01','Every replacement by a two-unit coin contributes exactly one extra unit')]},[method()],[variation('one-of-each-removed',[...add])]),
   stampConstraint:family({'decision-1':[u('S02.01','Enforce the positive-count requirement for both stamp types')],'possible-three':[...add,...div,...remainder],target:[...enumerate,...mul,...add,...remainder]},[method()],
    [variation('allow-zero-of-one-type',[...enumerate,...remainder,...mul,...add])]),
   machineMeeting:family({'rate-gap':[u('L04.01','Compare the change from a unit input increase'),...add],'constant-gap':[u('L04.01','Compare the outputs at input zero'),...add],target:[...div]},
    [method(),method('family-quantities',[u('L01.02','Represent the common input by an unknown'),u('L01.03','Remove equal quantities from both modeled outputs')])],[variation('raise-only-A-output',[u('L04.01','The output gap increases by one while its change per input stays fixed'),...add,...div])]),
   machineOrder:family({AB:[u('L04.01','Apply machine A and then machine B'),...order,...mul,...add],BA:[u('L04.01','Apply machine B and then machine A'),...order,...mul,...add],target:add},
    [method(),method('input-cancellation')],[variation('double-original-input',[u('L04.01','Both orderings keep the same multiplication of the changed input'),...order,...mul,...add])],
    {'input-cancellation':route({'AB-extra':[...order,...mul,...add],'BA-extra':[...order,...mul,...add],target:[u('A02.03','Remove the identical input-dependent quantity from both outputs'),...add]})}),
   digitDivisor:family({'decision-1':[u('N01.01','Division into zero-sized groups is undefined')],'divisible-*':[...digits,...enumerate,...remainder],target:[u('C01.03','Each distinct units digit contributes one disjoint candidate'),...add]},
    [method(),method('tens-divisors')],[variation('zero-cannot-be-a-divisor',[u('N01.01','No finite group count can make positive quantity from zero-sized groups')])],
    {'tens-divisors':route({'tens-part':[...position,...mul],'divisor-count':[u('N02.02','List every one-digit positive divisor of the tens part once')],target:[...digits,u('A01.01','Each retained divisor corresponds to exactly one legal units digit')]})}),
   divisibleEleven:family({'decision-1':[u('N01.03','The taught divisibility-by-five rule allows only zero or five in the units position')],'candidate-count':[...enumerate,...remainder,...position],target:compare},
    [method('family-quantities',[],unknownRule('alternating-sum-divisibility-eleven','The current declared divisibility lesson does not teach the alternating-place test for eleven')),method()],
    [variation('count-legal-four-digit-numbers',[...enumerate,...position,...remainder,u('N01.03','Restrict only the units digit with the taught five rule')])]),
   threeDivisors:family({'decision-1':[u('N02.06','Three positive divisors require exactly one unpaired middle divisor'),u('N02.05','An unpaired divisor occurs at the square root'),u('N02.03','The square root must be prime to avoid extra factor pairs')],'prime-limit':[u('A05.05','Bound candidate prime bases by the positive square root'),...compare],target:[u('N02.03','Check each candidate base against the definition of prime'),u('N02.06','Count only prime squares'),...enumerate]},[method()],
    [variation('largest-prime-square',[u('N02.03','Keep only squares of prime bases'),u('N02.06','Preserve the exact three-divisor condition'),u('A05.04','Form the prime squares'),...compare,...enumerate])]),
   divisorPowers:family({'two-exponents':[u('N02.06','The exponent of two can range from zero through the original exponent'),...add],'three-exponents':[u('N02.06','The exponent of three has its own independent bounded range'),...add],target:[u('C02.05','Each exponent pair yields one unique divisor'),u('A05.06','Read the prime power representation'),...mul]},[method('family-quantities',order)],
    [variation('square-divisors',[u('N02.05','A square divisor has even prime exponents'),u('N02.06','Count the retained exponent choices'),u('N01.05','Identify the even exponent values including zero'),u('C02.05','Pair independent exponent choices'),...mul])]),
   equalBags:family({'decision-1':[u('N03.03','The bag count must divide both actual color quantities')],'common-divisor':[u('N03.04','Choose the greatest common divisor for the maximum identical bag count')],target:[u('N03.04','Use the greatest divisor as the actual number of bags')]},[method()],
    [variation('all-possible-bag-counts',[u('N03.03','Retain every common divisor'),u('N02.02','List the positive divisors of the greatest common divisor once')])]),
   offsetBells:family({'decision-1':[u('N03.05','Distinguish a joint period from the first joint event with different origins')],offset:[u('L03.02','Preserve the actual starting time of the second timeline')],target:[u('N03.01','Find the first common actual event in the two offset arithmetic timelines'),...enumerate]},[method()],
    [variation('next-joint-event',[u('N03.02','Consecutive joint events are separated by the least common positive period'),...add])]),
   cyclicPosition:family({remainder:[u('N04.01','Remove complete seat cycles by remainder'),u('N04.03','A movement count starts from the actual initial seat')],target:[u('N04.03','Advance from that seat and wrap the displayed one-based labels')]},[method()],
    [variation('reverse-direction',[u('N04.03','Keep the same starting label and reverse the remaining movement'),...remainder,...add])]),
   repeatedOnes:family({'remainder-*':[u('L03.04','Appending one applies the explicit ten-times-plus-one recurrence'),...position,...mul,...add,...remainder],target:[u('N04.03','Use the established six-position remainder cycle'),u('N04.06','A full cycle ending at remainder zero uses the last position')]},
    [method(),method('family-quantities',[u('N01.02','Removing a whole divisible six-digit block preserves the remainder'),u('A05.06','Place-value multiplication by a power of ten preserves divisibility')])],[variation('append-one-more',[u('L03.04','Continue the same ten-times-plus-one remainder recurrence'),...mul,...add,...remainder])]),
   rectangleDiagonalArea:family({'rectangle-area':area,target:[u('G03.01','The diagonal splits the rectangle into two disjoint equal right triangles'),...div]},[method()],
    [variation('increase-only-length-by-half',[...area,u('A03.02','An added half refers to the original length'),...add,...div])]),
   boundaryNotch:family({'old-boundary':[...boundary,...mul],removed:[...boundary],bottom:[...boundary],extra:[u('G03.04','The middle notch replaces a boundary segment by an equal bottom and two new depth edges'),...mul],target:[...boundary,...add]},
    [method('replacement'),method('full-contour')],[variation('internal-hole-boundaries',[...boundary,...mul,...add])],{'full-contour':route({horizontal:[...boundary,...mul],vertical:[...boundary,...mul,...add],target:add})},'replacement'),
   angleMarks:family({'one-angle':[...angle,...div],target:[...mul]},[method()],[variation('other-direction',[...angle,...add])]),
   polygonTurn:family({'decision-1':[u('G02.02','Track the change of direction rather than an interior-angle sum')],'turn-total':angle,target:div},[method(),method('interior-supplement',order)],
    [variation('partial-vertex-traversal',[...angle,...div,...mul,u('N01.05','Read the stated odd/even vertex-count condition before choosing the specified traversal count')])],{'interior-supplement':route({triangles:[u('G02.04','Split the polygon into n minus two triangles'),...add],'interior-total':[u('G02.04','Add the triangle angle totals'),...mul],'one-interior':[...div],target:[...angle,...add]})}),
   lShapeArea:family({'outer-area':area,'missing-area':area,target:[u('G03.02','Remove the corner rectangle from the whole rectangle'),...add]},[method(),method('disjoint-rectangles')],
    [variation('same-hole-area',[...area,u('G03.02','Only the removed area matters for this area target'),...add])],{'disjoint-rectangles':route({'bottom-area':area,'upper-left-area':area,target:[u('G03.01','Add two nonoverlapping rectangles')]})}),
   crossArea:family({vertical:area,horizontal:area,intersection:area,target:[u('C01.05','Remove the second copy of the overlapping strip intersection'),...add]},[method(),method('uncovered-corners')],
    [variation('intersection-only',area)],{'uncovered-corners':route({'unused-width':add,'unused-height':add,'uncovered-area':[u('G03.03','Rearrange the four uncovered corners into one rectangle'),...area],'whole-area':area,target:[u('G03.02','Remove the uncovered area from the whole rectangle'),...add]})}),
   semicircleBoundary:family({'half-arc':[u('G04.05','Use half of the given whole circumference'),...div],diameter:[u('G04.02','The diameter contains two radii'),...mul],target:[u('G01.02','Both the arc and cut diameter are part of the actual boundary'),...add]},[method()],
    [variation('rejoin-whole-circle',[u('G04.03','Rejoining along the diameters leaves the original full circle boundary')])]),
   circleRingRatio:family({'inner-squared':[u('G04.04','Circle area contains the radius squared'),...mul],'outer-squared':[u('G04.04','Use the outer radius for the whole area'),...mul],target:[u('G03.02','Subtract the inner circle area'),u('A04.01','Divide ring area by the specified outer-circle whole'),...add,...div]},[method()],
    [variation('double-both-radii',[u('G04.04','Both circle areas contain the squared radius'),u('R04.03','Both areas change by the same squared length factor'),u('A04.01','A common area multiplier leaves the part-to-whole ratio unchanged')])]),
   shadowSimilarity:family({'small-ratio':[...similar,u('R01.02','Keep pole height and shadow length in their corresponding order'),...div],target:[...similar,u('R01.04','Use the same height-to-shadow ratio under the same light direction'),...mul]},[method('shadow-factor')],
    [variation('new-light-angle',[...similar,u('R01.04','All shadows at the new shared light angle change by the same factor'),...div])],
    {'shadow-factor':route({'shadow-factor':[...similar,u('R01.02','Express shadow length as an integer number of pole-height parts'),...div],'big-shadow':[u('A01.01','Read the given actual shadow length of the large pole')],target:[...similar,u('R01.04','Use the same shadow-to-height multiplier under the stated light angle'),...div]})}),
   parallelTriangle:family({'small-area-ratio':[...similar,u('G05.04','The area ratio is the square of the corresponding side ratio'),...mul],'small-area':[u('G05.04','Apply that area fraction to the original triangle'),...mul],target:[u('G03.02','Subtract the top triangle to leave the lower trapezoid'),...add]},[method()],
    [variation('half-corresponding-side',[...similar,u('G05.04','Halving both corresponding lengths quarters the small triangle area'),u('A03.02','The rest is measured as part of the same original triangle'),...add])]),
   coordinateHorizontal:family({'decision-1':[u('G06.04','Equal y coordinates place both points on the same horizontal line')],target:[u('G06.04','The horizontal distance is the absolute coordinate difference'),u('A05.03','When necessary count the coordinate interval across zero')]},[method()],[
    variation('new-coordinate-difference',[u('G06.04','Compute the distance from the two updated horizontal coordinates'),...add],c=>`新的两点为(${c.math.a+5},${c.math.y})和(${c.math.b+5},${c.math.y})。纵坐标仍相同，两横坐标相差${c.extension.answer}，所以距离为${c.extension.answer}。`),
    variation('translate-both-x-coordinates',[u('S01.04','Translating both endpoints by the same horizontal amount preserves their difference'),u('G06.04','The segment remains horizontal')])]),
   cubeSteps:family({'first-last':[u('L03.02','Column heights form the stated consecutive arithmetic sequence'),...add],target:[u('S02.04','Pair two opposite copies without changing the original total'),...mul,...div]},[method()],
    [variation('two-block-thickness',[u('A02.04','Each original block gains one matching block, so the actual block count doubles')])]),
   openBox:family({'largest-cut':[u('N01.02','Restrict cut size to positive integers with positive remaining base length'),...div],'decision-1':[u('G07.03','Both cut corners on the same side reduce the base by twice the cut size')],'base-*':[u('G07.03','Read the remaining base from the valid unfolding'),...mul,...add],'volume-*':[u('G07.05','Multiply the square base area by the cut-size height'),...mul],target:[...enumerate,...compare]},[method()],
    [variation('fixed-cut-base-area',[u('G07.03','Use the base dimensions after the specified corner cuts'),...area,...add])]),
   'natural-coordinateDistance':family({'x-gap':[u('L04.03','Read horizontal coordinates separately from vertical coordinates'),...add],'y-gap':[u('L04.03','Read the vertical coordinate difference'),...add],'decision-1':[u('G06.01','A horizontal and a vertical displacement form a right triangle')],target:[...pythagoras,u('G06.05','Use the diagonal distance rather than the grid detour')]},
    [method(),method('family-quantities',[u('G05.02','Identify the corresponding scaled three-four-five right triangle'),u('R01.04','Apply the same scale to the hypotenuse')])],
    [variation('grid-only-distance',[u('L04.03','Separate horizontal and vertical displacement'),u('G06.04','Measure the two axis-aligned lengths'),...add])]),
   oppositeScale:family({'length-ratio':[u('R01.04','Read the stated new-to-original length factor')],'decision-1':[u('R04.03','The two length factors multiply to the unchanged area factor')],target:[u('R04.03','Use the reciprocal width factor'),...mul,...div]},[method(),method('representative-area')],[
    variation('direct-area-comparison',[...area,u('R01.04','Scale both stated side lengths by the given factor'),u('A04.01','Compare the new area with the original area'),...div,...order],c=>`取原长${c.math.a}、原宽${c.math.old}。新长${c.math.b}，新宽为${c.math.old}×${c.math.b}÷${c.math.a}。新旧面积之比为${c.math.b}×(${c.math.old}×${c.math.b}÷${c.math.a})÷(${c.math.a}×${c.math.old})=${c.extension.answer}，各步保留精确值。`),
    variation('square-length-factor',[u('R04.03','Area uses the product of the two equal length factors'),...mul])],{'representative-area':route({'original-area':area,'new-length':[u('R01.04','The representative original length a becomes b under the stated factor')],target:[...area,...div]})}),
   similarAreaPerimeter:family({'area-ratio':[...similar,u('G05.04','Read the area ratio of the corresponding similar figures')],'length-ratio':[u('G05.04','Recover the length ratio from the squared area ratio'),u('A05.05','Use the positive roots of the two area-ratio parts')],target:[u('G05.03','Perimeter scales by the corresponding length ratio'),...mul]},
    [method('integer-length-parts')],[variation('new-perimeter-to-area',[u('G05.03','A perimeter multiplier gives the corresponding length multiplier'),u('G05.04','Square that multiplier for the area'),...mul])],
    {'integer-length-parts':route({'small-length-part':[u('G05.04','Each area-ratio part is the square of a length-ratio part'),u('A05.05','Take the positive root of the smaller area part')],'large-length-part':[u('G05.04','Use the corresponding larger area part'),u('A05.05','Take its positive root')],'perimeter-one-part':[u('G05.03','Divide the known perimeter by its length-ratio parts'),...div],target:[u('G05.03','Multiply that common perimeter part by the larger length-ratio part'),...mul]})}),
   scaleAreaReverse:family({'net-length':[u('R04.05','The second length change uses the already changed length'),...mul,...div],'net-area':[u('R04.03','Square the net corresponding-length factor'),...mul],target:[u('R04.03','Undo the net area factor'),...div]},
    [method(),method('reverse-area-stages')],[variation('first-scaling-only',[u('R04.03','Only the first length multiplier contributes to the changed area'),...mul])],
    {'reverse-area-stages':route({'before-second':[u('R04.03','Undo the last length contraction using its squared area factor'),...mul],target:[u('R04.03','Undo the first length expansion using its squared area factor'),...div]})}),
   jointWork:family({'rate-total':[u('R03.05','Add the simultaneously active work rates'),...add],'work-total':[u('R02.02','Read the required box count as the actual work quantity')],target:[u('R03.05','Divide total work by the combined work rate'),...div]},[method()],
    [variation('one-worker-only',[u('R02.02','Use only the remaining active worker rate'),...div])]),
   'natural-offers':family({'shop-A':[...percent,u('R02.02','Multiply the specified item price by the actual count'),...mul,...add],'shop-B':[u('R02.02','Use the other per-item price without a fixed delivery fee'),...mul,...add],target:[u('R02.03','Compare whole-order money costs in the same unit'),...add]},
    [method('family-quantities',order),method('per-item-gap')],[variation('integer-order-threshold',[...percent,u('R02.02','Separate the per-item price gap from the fixed order fee'),u('N01.02','The smallest whole item count must reach the cost threshold'),...mul,...add,...div])],
    {'per-item-gap':route({'A-unit':[...percent,u('R02.02','Discount the per-item price while preserving its money-per-item unit')],'unit-gap':[u('R02.03','Subtract the two actual per-item prices'),...add],'before-fee-gap':[...mul],target:[u('R02.03','Apply the one fixed order fee after accumulating the item-price gap'),...add]})}),
   discountOrder:family({'decision-1':[...percent],'discounted':[...percent,...mul],target:add},[method()],[variation('coupon-before-percent',[...percent,...add,...mul])]),
   fractionSharedRemainder:family({'after-second':[u('A03.07','Undo the last fraction using the current whole'),u('A03.04','The retained current fraction is five eighths'),...mul,...div],'before-return':[...inverse],target:[u('A03.07','The restored remainder is two thirds of the original whole'),u('A03.04','Use the exact original retained fraction'),...mul,...div]},[method()],
    [variation('both-fractions-use-original',[u('A03.02','Both used fractions now refer to the same original whole'),u('A03.04','Combine the original thirds and eighths using equivalent fractions'),...mul,...div,...add])])
  };
 }
 return {authored,cohortThree,cohortFour};
})();
if(typeof module!=='undefined')module.exports=TeachingSkillContractsExtra;

'use strict';
// Final original-configuration review. These are use contracts, not mastery claims.
const TeachingSkillContractsFinal=(()=>{
 function authored(use){
  const u=use,route=(nodes,more={})=>({nodes,...more}),method=(routeId='family-quantities',extras=[],more={})=>({routeId,extras,...more}),variation=(id,uses,more={})=>({id,uses,...more});
  const family=(nodes,methods,variations,alternatives={},routeId='family-quantities')=>({revision:2,routes:{[routeId]:route(nodes),...alternatives},methods,variations,reviewStatus:'DEVELOPER_REVIEW_NATIVE_AND_PEDAGOGICAL_ACCEPTANCE_PENDING'});
  const add=[u('A02.01','Combine or remove the actual stated quantities')],mul=[u('A02.04','Combine equal groups by multiplication')],div=[u('A02.05','Divide into equal groups')],order=[u('A02.06','Interpret the grouped multi-operation expression in its stated order')];
  const enumeration=[u('C02.03','Visit every bounded legal candidate once')],partition=[u('C01.03','Add mutually exclusive complete branches')],product=[u('C02.05','Each first choice can be paired with exactly the stated remaining choices')],dedup=[u('C02.04','Account for the actual multiplicity of identical outcomes')];
  const queue=[u('C03.02','Fill distinct ordered positions with the remaining different objects')],team=[u('C03.03','Keep each unordered selection exactly once')],probability=[u('D03.03','The elementary retained outcomes remain equally likely'),u('D03.04','Compare favorable elementary outcomes with the explicit current sample space')];
  const area=[u('G01.03','Count rectangle unit-square rows'),...mul],cycle=[u('N04.03','Align the counted position with the repeated cycle')],remainder=[u('N01.02','Check actual integer quotient and remainder')],recurrence=[u('L03.05','Each term depends on its two immediately preceding terms')];
  const outside=[u('C04.02','Subtract the forbidden complement from the specified whole'),...add],power=[u('A05.06','Interpret the repeated same-size position choices as repeated multiplication')];
  const gap={id:'negative-integer-products',reason:'A05 lessons cover positions, ordering, crossing zero, squares and positive powers; they do not establish negative-integer multiplication sign rules'};
  const overlap={'overlap-width':add,'overlap-height':add,intersection:area,union:[u('C01.05','The shared rectangle was included in both full squares'),...area,...add],target:area};
  const pairCount={'all-pairs':[...team,...product,...dedup,...mul,...div,...add],'red-pairs':[...team,...product,...dedup,...mul,...div,...add],target:probability};
  const unordered={'ordered':[...product,...mul,...add],multiplicity:dedup,target:[...team,...dedup,...div]};
  const result={
   recurrenceBackwards:family({'term-*':[...recurrence,u('A02.03','Reverse the known sum using the adjacent known terms'),...add]},
    [method('reverse-recursion'),method('reverse-recursion',[u('L01.02','Represent both unknown starting terms'),u('L01.03','Multiply both sides of each equality by the same positive number'),u('L01.05','Substitute the recovered starting terms'),...mul,...order],{unverifiedKnowledge:[{id:'two-equation-elimination',reason:'The current single-unknown balance lessons do not establish eliminating a second unknown between two equations'}]})],
    [variation('changed-first-term',[...recurrence,...add])],{},'reverse-recursion'),
   overlapSquares:family(overlap,[method('family-quantities',[...power,...order]),method('new-strips')],
    [variation('exactly-one-square',[...area,u('C01.02','Separate the only-first, only-second and shared regions'),...add])],
    {'new-strips':route({'first-area':area,'right-strip':[...area,...add],'upper-strip':[...area,...add],target:partition})}),
   ladderShift:family({'initial-height':[u('G06.03','Recover the initial right-triangle leg from the fixed hypotenuse')],'new-height':[u('G06.03','Recover the changed right-triangle leg from the same hypotenuse')],target:add},
    [method('family-quantities',[...power,...order]),method('family-quantities',[u('G05.02','Compare the stated scaled three-four-five triangles'),u('R01.04','Convert one length part to its actual size')])],
    [variation('height-to-base',[u('G06.03','Solve the right triangle with the height as the given leg')])]),
   gridDetour:family({'all-routes':enumeration,'to-P':enumeration,'from-P':enumeration,'through-P':[...product,...mul],target:outside},
    [method('subtract-through'),method('direct-grid')],
    [variation('first-up',[...enumeration,u('C03.04','Fix only the first upward step; the former forbidden point is removed')])],
    {'direct-grid':route({'cell-*':[u('C02.01','Partition arrivals by their distinct last step; the forbidden point has none'),...add],target:partition})},'subtract-through'),
   adjacentLine:family({'decision-1':[u('C03.04','An adjacent pair is one outer object with two internal orders')],'outer-arrange':[...add],'outer-choice-*':queue,'outer-orders':[...queue,...product,...mul],'order-count':[u('C03.01','Swapping the two distinct friends changes their internal order')],target:[...product,...mul]},
    [method(),method('adjacent-position')],
    [variation('not-adjacent',[...queue,...product,...mul,...outside,u('C03.04','Remove all and only the adjacent arrangements')])],
    {'adjacent-position':route({'starts':[u('C03.04','Every adjacent pair occupies a unique starting position'),...add],'inside':[u('C03.01','Both internal orders are distinct')],'other-choice-*':queue,'other-orders':[...queue,...product,...mul],target:[...product,...mul]})}),
   restrictedTeam:family({'all-teams':[...team,...enumeration],invalid:[u('C03.04','Fix both specified friends and choose only the third person'),...add],target:outside},
    [method(),method('specified-members')],
    [variation('both-required',[u('C03.04','Fix both friends; only the third identity varies'),...add])],
    {'specified-members':route({'neither':[...team,...enumeration],'one-friend':[...team,...enumeration,...product,...mul],target:partition})}),
   digitComplement:family({'all-strings':[...product,...power],'avoid':[...product,...power,...add],target:outside},
    [method('family-quantities',order),method('first-occurrence')],
    [variation('exactly-one',[u('C02.01','Partition by the unique special-digit position'),...product,...mul,...power,...add])],
    {'first-occurrence':route({'first-*':[u('C02.01','First occurrence uniquely identifies this branch'),...product,...mul,...add],target:partition})}),
   diceSum:family({'decision-1':[u('D03.02','The complete sample space consists of ordered dice pairs'),u('D03.03','Each elementary pair is equally likely')],'all-pairs':[...product,...mul],'good-pairs':[...enumeration,...add],target:probability},
    [method(),method('family-quantities',[u('C02.01','Partition successful pairs by the first die')])],
    [variation('different-points',[...probability,...enumeration,...outside,u('C04.01','The new whole excludes every equal-point pair'),...mul,...add])]),
   checkerDomino:family({'remaining':[...mul,...add],'decision-1':[u('S02.03','Every legal placement covers adjacent opposite colors')],'limiting-color':[u('S02.05','Every domino consumes one cell of the limited color'),...mul,...div,...add],'first-row':[u('S02.03','Place horizontal dominoes from column two along the first row'),...div,...add],'middle-rows':[u('S02.03','Fill every intact middle row with horizontal dominoes'),...mul,...div,...add],'last-row':[u('S02.03','Place horizontal dominoes from column one along the last row'),...div,...add],target:[u('S02.05','The constructed legal placement reaches the color upper bound'),...add]},
    [method()],
    [variation('remove-two-top-corners',[u('S02.03','The remaining top row has even width and every other row can be tiled'),u('S02.05','One cell of each color is removed, so the construction reaches the cell-count bound'),...mul,...add,...div])]),
   'natural-pairChance':family(pairCount,[method('family-quantities',order),method('ordered-draws')],
    [variation('with-replacement',[...probability,u('D03.05','The replacement restores the full bag before stage two'),...product,...mul,...div])],
    {'ordered-draws':route({'all-first':[u('D03.02','Every concrete first ball is possible')],'all-second':[u('D03.05','Without replacement one concrete ball is removed'),...add],'all-ordered':[...product,...mul],'red-first':[u('D03.02','Retain red first balls')],'red-second':[u('D03.05','One red ball was already removed'),...add],'red-ordered':[...product,...mul],target:probability})}),
   overlapProbability:family({...overlap,target:probability},[method('family-quantities',order),method('three-regions')],
    [variation('sample-first-square',[...area,...add,...probability,u('C04.01','The sample whole is only the first square')])],
    {'three-regions':route({'shared-width':add,'shared-height':add,shared:area,'only-first':[...area,...add],'only-second':[...area,...add],whole:partition,target:probability})}),
   ratioUnion:family({attendance:[u('C01.05','Restore the duplicated attendance of shared members'),...add],parts:[u('R01.01','Count the two labeled ratio parts'),...add],'part-value':[u('R01.05','Restore one part from the attendance total'),...div],'B-total':[u('R01.02','Keep the ball-group label on the second ratio member'),...mul],target:[u('C01.02','Remove shared members from the complete ball group'),...add]},
    [method(),method('family-quantities',[u('L01.02','Represent one ratio part by an unknown'),u('L01.03','Balance the union equality'),...order])],
    [variation('only-chess-joins-ball',[u('R01.02','The chess count is unchanged while the ball count gains one'),u('C01.02','One only-chess identity moves to the intersection'),...mul,...add,...div])]),
   chartAverage:family({count:[u('D01.04','Read every actual bar frequency'),...add],'score-total':[u('D02.06','Weight each actual score by its bar frequency'),...mul,...add],target:[u('D02.02','Divide the combined actual score by the actual person count'),...div]},
    [method('family-quantities',order),method('mean-baseline',order)],
    [variation('add-six-score',[u('D02.02','Update both the actual score total and actual person count'),u('D02.06','Keep the unchanged score frequencies'),u('D01.04','Read the original frequencies'),...mul,...add,...div])],
    {'mean-baseline':route({people:[u('D01.04','Read and combine the frequencies'),...add],'baseline-total':[...mul],'low-deficit':[u('D02.06','Measure the low-score group deficit from the same baseline'),...mul],'high-surplus':[u('D02.06','Measure the high-score group surplus from the same baseline'),...mul],total:add,target:[u('D02.02','Average the adjusted actual total'),...div]})}),
   parityPermutations:family({'odd-count':[u('N01.05','Partition the integers into their actual odd and even identities')],'odd-choice-*':queue,'odd-orders':[...queue,...product,...mul],gaps:[u('C03.04','Count both endpoints and all internal gaps'),...add],'gap-selection':[...team,...enumeration,u('C03.04','At most one even identity occupies each selected gap')],'even-choice-*':queue,'even-orders':[...queue,...product,...mul],target:[...product,...mul]},
    [method()],
    [variation('changed-gap-boundary',[u('N01.05','Read which parity class remains separated and whether the first position is restricted'),u('C03.04','Recount exactly the gaps allowed by the new boundary'),...queue,...team,...enumeration,...product,...mul,...add])]),
   recurrenceRemainders:family({'decision-1':[...recurrence,u('L03.01','A repeated adjacent pair reproduces all subsequent remainder states')],'residue-*':[...recurrence,...remainder,...add],'returned-pair':[u('L03.01','Verify both components return to the initial ordered pair')],'pair-period':[u('L03.01','Use the first repeated adjacent pair as the period')],'cycle-sum':add,'whole-cycles':[...cycle,...remainder],'tail-size':remainder,'tail-sum':[...cycle,...add],target:[...cycle,...mul,...add]},
    [method('family-quantities',order)],
    [variation('both-start-two',[...recurrence,...remainder,u('L03.01','Recompute the actual remainder cycle for the changed initial pair'),...mul,...add])]),
   signedProduct:family({'signs':[u('A05.01','Distinguish the negative, zero and positive card values')],'one-negative':[u('A05.02','Compare signed candidate products'),...mul],'three-negative':mul,target:[u('A05.02','Compare all signed category minima')]},
    [method('sign-categories',order,{unverifiedKnowledge:[gap]}),method('complete-enumeration',[],{unverifiedKnowledge:[gap]})],
    [variation('two-cards',[u('A05.01','Read both signed card values'),u('A05.02','Compare signed candidate products'),...mul],{unverifiedKnowledge:[gap]})],
    {'complete-enumeration':route({'triple-*':[...team,...enumeration,...mul],target:[u('A05.02','Compare all signed products')]},{unverifiedKnowledge:[gap]})},'sign-categories'),
   recurrenceForward:family({'decision-1':recurrence,'term-*':[...recurrence,...add],target:recurrence},[method()],
    [variation('swap-initial-terms',[...recurrence,...add])]),
   recurrenceTotal:family({'term-*':[...recurrence,...add],target:add},[method(),method('difference-cancellation')],
    [variation('omit-first',[...recurrence,...add])],
    {'difference-cancellation':route({'next-term':[...recurrence,...add],'second-next':[...recurrence,...add],'cancel-middle':[u('A02.03','Each added intermediate term is also removed exactly once')],target:[...add]})}),
   hypotenuseMidpoint:family({'half-turn':[u('S01.03','A half-turn about the midpoint swaps the hypotenuse endpoints')],'opposite-x':[u('S01.03','The rotated perpendicular side is the vertical line through the other endpoint'),u('G06.05','Locate the horizontal component on the given coordinate axes')],'opposite-y':[u('S01.03','The other rotated side is the horizontal line through the remaining endpoint'),u('G06.05','Locate the vertical component on the same coordinate axes')],hypotenuse:[u('G06.03','Find the diagonal of the resulting rectangle from its two perpendicular sides')],target:[u('S01.03','The rotation center bisects the original vertex and its rotated image'),...div]},
    [method('family-quantities',[u('G06.05','Locate the resulting rectangle with two coordinate axes')],{useRouteFrames:true}),method('family-quantities',[],{unverifiedKnowledge:[{id:'rectangle-diagonals-shortcut',reason:'The raw method invokes equal bisected rectangle diagonals without supplying their proof; the half-turn route derives the distance directly'}]})],
    [variation('long-leg-midpoint',[...div,u('G06.04','The new midpoint lies on the known straight leg')])]),
   setOutside:family({attendance:add,union:[u('C01.05','Shared members appeared in both group counts'),...add],target:outside},[method()],
    [variation('same-outsider-joins-both',[u('C01.01','Both memberships belong to the same single identity'),...outside,...add])]),
   threeSetExactlyTwo:family({'only-AB':[u('C01.02','Remove triple-membership from the complete AB intersection'),...add],'only-AC':[u('C01.02','Remove the same triple-membership from AC'),...add],'only-BC':[u('C01.02','Remove the same triple-membership from BC'),...add],target:partition},
    [method(),method('family-quantities',[u('C04.04','Triple members occur in each of the three pair intersections'),...mul,...order])],
    [variation('at-least-two',[u('C01.02','Distinguish exactly-two from triple-membership'),...partition,...add])]),
   menuBranches:family({'decision-1':[u('C02.05','Rice-with-dish and noodle-only are alternative complete meal branches')],'rice-meals':[...product,...mul],'noodle-meals':[u('C02.02','Each noodle choice itself is one complete meal')],target:partition},[method()],
    [variation('drink-with-each-meal',[...partition,...product,...mul])]),
   binaryNoNeighbors:family({'decision-1':[u('C02.01','The first off/on choices partition every legal string')],'base-empty':[u('C02.01','The empty remainder has one empty arrangement')],'base-one':[u('C02.01','A single remaining lamp may be off or on')],'count-*':[...recurrence,...partition,...add],shorter:recurrence,'two-shorter':recurrence,target:[...recurrence,...partition,...add]},
    [method()],
    [variation('first-on',[u('C03.04','Fix the first lamp on and the second off'),...recurrence,...partition,...add])],
    {'lamp-enumeration':route({'on-count-*':[...enumeration,u('C03.04','Keep only selected positions with no adjacent pair')],target:partition})}),
   unorderedPairs:family(unordered,[method('family-quantities',order),method('forward-pairs')],
    [variation('two-distinct-jobs',[u('C03.01','The two jobs make exchanging the identities a different result'),...product,...mul,...add])],
    {'forward-pairs':route({'first-*':[u('C02.01','Use the smaller identity as the unique first member'),...enumeration,...add],target:[...team,...partition]})}),
   circularSeating:family({'decision-1':[...dedup,u('S01.03','Fix one identity to select one representative of each rotational class')],neighbor:[u('C03.04','The specified friend can occupy either distinct neighboring seat')],remaining:add,'seat-choice-*':queue,'seat-orders':[...queue,...product,...mul],target:[...product,...mul]},
    [method(),method('circle-block')],
    [variation('no-adjacency',[...queue,...product,...mul,...dedup,u('S01.03','Fix one identity; preserve mirror images as different')])],
    {'circle-block':route({'block-objects':[u('C03.04','Treat the adjacent pair as one circular object'),...add],'free-objects':[...dedup,u('S01.03','Fix the block to remove only whole-circle rotations'),...add],'block-choice-*':queue,'block-orders':[...queue,...product,...mul],inside:[u('C03.01','Both internal orders of the block are distinct')],target:[...product,...mul]})}),
   differentDigits:family({first:[u('C03.01','Choose a symbol for the first ordered position')],second:[u('C03.04','Exclude exactly the already chosen first identity'),...add],target:[...product,...mul]},
    [method('family-quantities',[...outside,...power]),method()],
    [variation('exchange-equivalent',[...team,...dedup,...mul,...div,...add])]),
   allThreeColors:family({'all-colorings':[...product,...power],'avoid-one':[...product,...power],'pure-colorings':[u('C04.04','A one-color string is contained in two missing-color events')],target:[...outside,u('C04.04','Deduct three missing-color events and restore each twice-deducted pure string once'),...mul,...add]},
    [method('family-quantities',order)],
    [variation('exactly-two',[u('C02.01','Partition by the uniquely missing color'),...product,...power,...outside,...mul,...add])],
    {'color-usage-states':route({'one-*':[u('C02.01','Extend the same single used color')],'two-*':[u('C02.01','Extend two-color strings by either used color, or one-color strings by either new color'),...product,...mul,...add],'three-*':[u('C02.01','Extend three-color strings by any color, or two-color strings by their unique missing color'),...product,...mul,...add],target:partition})}),
   truncatedBars:family({A:[u('D01.03','Read the nonzero axis baseline and its per-grid scale'),u('D01.04','Read the actual A bar height'),...mul,...add],B:[u('D01.03','Restore the same baseline separately to the B bar'),u('D01.04','Read the actual B bar height'),...mul,...add],target:add},[method()],
    [variation('bar-difference',[u('D01.03','The common baseline cancels only in the difference'),u('D01.04','Read both bar heights'),...mul,...add])]),
   cumulativeChart:family({'decision-1':[u('D01.06','Each cumulative total includes all smaller score values')],'up-to-one':[u('D01.06','Read the excluded lower cumulative count')],'up-to-three':[u('D01.06','Read the inclusive upper cumulative count')],target:add},[method()],
    [variation('exact-four',[u('D01.06','Subtract the cumulative count up to three from the count up to four'),...add])]),
   medianSort:family({'middle-position':[u('D02.04','The median of five sorted values is at position three')],target:[u('D02.03','Sort all five actual scores before selecting the middle'),u('D02.04','Read the selected sorted value')]},[method()],
    [variation('increase-largest',[u('D02.03','The changed largest score remains the sorted maximum'),u('D02.04','The middle sorted identity is unchanged'),...add])]),
   spinnerLabels:family({'sample-size':[u('D03.02','The elementary outcomes are physical equal-area sectors'),...add],'target-size':[...partition,...add],target:probability},
    [method(),method('family-quantities',[...outside])],
    [variation('known-not-C',[u('C04.01','Restrict the current whole to the retained A and B sectors'),...probability,...add])]),
   conditionalBalls:family({'all-pairs':[...team,...product,...dedup,...mul,...div,...add],'exclude-blue':[...team,...product,...dedup,...mul,...div,...add],'conditional-space':[u('C04.01','The conditioning whole contains only pairs with at least one red ball'),...outside,...add],'both-red':[...team,...product,...dedup,...mul,...div,...add],target:probability},
    [method(),method('retained-pairs')],
    [variation('known-same-color',[u('C04.01','Retain exactly red-red or blue-blue pairs'),...team,...product,...dedup,...partition,...probability,...mul,...div,...add])],
    {'retained-pairs':route({'red-pairs':[...team,...product,...dedup,...mul,...div,...add],'mixed-pairs':[...product,...mul],whole:[u('C04.01','The disjoint RR and RB branches exactly satisfy at-least-one-red'),...partition],target:probability})}),
   quarterTurn:family({'full-cycle':[u('S01.03','Four clockwise right-angle rotations restore the direction')],remaining:[...cycle,...remainder],target:[u('S01.03','Apply the remaining rotations to the original direction')]},[method()],
    [variation('counterclockwise',[u('S01.03','Reverse the rotation direction from the same original arrow'),...cycle,...remainder])]),
   transformOrder:family({'decision-1':[u('S01.02','Read the stated mirror axis'),u('S01.03','Read the stated rotation order')],'after-rotation':[u('S01.03','Finish the specified clockwise rotations first'),...cycle,...remainder],target:[u('S01.02','Apply the vertical-axis reflection to the rotated arrow')]},[method()],
    [variation('mirror-first',[u('S01.02','Mirror the original arrow first'),u('S01.03','Rotate the reflected arrow second'),...cycle,...remainder])]),
   lightSwitchParity:family({presses:[...mul,...add],parity:[u('N01.05','Partition the actual press count by odd/even')],target:[u('S02.02','Pairs of presses restore the starting state; an unpaired press flips it')]},[method()],
    [variation('one-more-press',[u('S02.02','One additional legal press flips the previously determined state'),u('N01.05','The press parity changes'),...mul,...add])]),
   ballReplacement:family({'white-white':[u('S02.03','Two white balls are removed and a black ball returned'),...add],'black-black':[u('S02.03','No white ball participates in this same-black replacement')],'white-black':[u('S02.03','The removed white ball is replaced by a white ball')],'decision-1':[u('S02.04','Every legal replacement preserves white-count parity'),u('N01.05','Removing two preserves parity')],parity:[u('N01.05','Read the parity of the actual initial white count')],target:[u('S02.04','At termination the preserved white parity identifies white count zero or one')]},[method()],
    [variation('add-one-white',[u('S02.04','All three replacement cases still preserve white-count parity'),u('N01.05','One added white ball changes the initial parity'),...add])]),
   transferBetweenBoxes:family({'gap-parts':[u('R01.02','Keep the actual A/B ratio identities'),...add],'gap-count':[u('A02.03','An internal transfer decreases one box while increasing the other'),...mul],'one-part':[u('R01.05','Restore a ratio part from the actual original gap'),...div],target:[u('R01.02','Recover the original A part count'),...mul]},[method()],
    [variation('external-addition',[u('A02.03','External addition changes only A; the B count stays fixed'),u('R01.02','Preserve the original labeled box counts'),...mul,...add])]),
   rectanglePointAreas:family({'height-span':[u('G03.03','Split and mirror triangle pieces to pair each triangle with an equal copy'),u('S01.02','Reflection preserves each copied area')],'doubled-opposites':[...mul,...add],'opposite-total':[u('G03.03','The two doubled opposite triangles exactly fill the rectangle'),...div],'decision-1':[u('G03.03','The other opposite pair doubles to the same full rectangle')],target:add},[method()],
    [variation('move-right',[u('G03.03','The two horizontal distances still partition the fixed width'),u('S01.04','Only the interior point translates horizontally'),...add])]),
   worstCaseColors:family({'avoid-*':[u('L02.04','The selected count cannot exceed this actual color inventory'),u('L02.03','A failing color count is at most one below the target'),...add],'maximum-failure':[...partition,u('L02.05','All listed failing color counts can be chosen simultaneously')],target:[u('S02.05','One more than the maximum possible failing sample guarantees success'),...add]},[method()],
    [variation('target-increased',[u('L02.04','Keep every actual color inventory'),u('L02.03','Recompute each integer failure cap'),u('L02.05','Construct the new largest failing sample'),u('S02.05','The next draw exceeds every failing sample'),...add])]),
   stagedClimb:family({'net-day':[...add],'decision-1':[u('L03.04','Stop immediately at the first daytime arrival')],'before-final':[u('A02.03','Remove the final daytime advance before counting full cycles'),...add],target:[u('L02.03','Choose the least integer number of full cycles that reaches the threshold'),...remainder,...div,...add]},
    [method('family-quantities',order)],
    [variation('nighttime-check',[u('L03.02','Each complete day/night advances by the same actual difference'),u('L02.03','Find the first integer full-cycle count meeting the height'),...remainder,...div,...add])],
    {'daily-highs':route({'day-*':[u('L03.02','Each new daytime peak adds one actual full-cycle gain'),...add],target:[u('A01.04','Select the first peak reaching the stated stopping height')]})}),
   consecutiveRepresentations:family({'decision-1':[u('L01.02','Represent the unknown positive first term for each candidate length')],'maximum-length':[...enumeration,...add,u('A01.04','The sum starting at one bounds all longer positive representations')],'length-*':[u('L01.02','Separate the repeated first term from the consecutive offsets'),...remainder,...div,...add,...enumeration],target:partition},
    [method('family-quantities',[u('N02.02','The raw formula screens candidate lengths by factors of twice the total'),...order,...mul])],
    [variation('allow-zero-start',[...enumeration,...add,...mul,...div,...order,...remainder,u('L01.02','The only additional representations start exactly at zero')])]),
   remainderProbability:family({'whole-cycles':[...remainder,...cycle],tail:remainder,'tail-good':[...remainder,...cycle],good:[...partition,...add],target:probability},[method()],
    [variation('add-zero-card',[...remainder,...probability,...cycle,...add,u('C04.01','Add exactly the extra zero card to the elementary sample whole')])]),
   rotatingColors:family({'decision-1':[...dedup,u('S01.03','Only cyclic rotations identify whole-circle strings; reversal alone does not')],'fixed-count':[...team,...enumeration],'rotation-class-*':[...enumeration,...dedup,u('S01.03','List every cyclic rotation of this concrete representative')],target:[...partition,...dedup]},
    [method('gap-records',[],{useRouteFrames:true})],
    [variation('fixed-star',[...team,...enumeration,u('C03.01','The fixed star gives a permanent ordered numbering')])],
    {'gap-records':route({'blue-count':add,'gap-record-count':[...enumeration,...partition],'gap-class-*':[...enumeration,...dedup,u('S01.03','Only cyclic changes of the starting red position identify gap records')],target:[...dedup,...partition]})}),
   'rule-packs-enough':family({'upper-pack':[u('L02.03','The first whole pack count meeting demand bounds all larger positive-price pack purchases'),...remainder,...div],'cost-*':[u('L02.05','For each candidate pack count buy only the remaining required singles'),...mul,...add],target:[u('L02.05','Compare every legal purchase cost against the same minimum objective'),u('A01.04','Choose the least actual total cost')]},
    [method('purchase-candidates')],
    [variation('change-demand',[...enumeration,u('L02.03','Recompute the actual whole-pack bound for the changed demand'),u('L02.05','Compare all purchases meeting the new demand'),...remainder,...mul,...div,...add])],{},'purchase-candidates')
  };
  result.signedProduct.routes['sign-categories'].unverifiedKnowledge=[gap];
  return result;
 }
 return {authored};
})();
if(typeof module!=='undefined')module.exports=TeachingSkillContractsFinal;

'use strict';
// Reviewed original generator-3 configurations only. Reasons describe actual
// authored quantities, not title matches or certification of student mastery.
const TeachingSkillContracts=((math,extra,final)=>{
 const use=(skillId,reason)=>({skillId,reason});
 const family=(nodes,methodExtras,variation)=>({revision:1,routeId:'family-quantities',nodes,methodExtras,variation,
  reviewStatus:'DEVELOPER_REVIEW_NATIVE_AND_PEDAGOGICAL_ACCEPTANCE_PENDING'});
 const catalog={
  fractionBackwards:family({
   'second-remainder':[use('A03.02','Identify one third of the current whole'),use('A03.07','Second-day whole is the first-day remainder')],
   'after-first':[use('A02.05','Divide the final two parts to find one part'),use('A02.04','Reconstruct three equal parts'),use('A02.03','Undo removal in reverse order')],
   target:[use('A02.04','Double the first-day remainder to restore the original whole')]
  },[[],[]],[use('A03.02','Both uses now refer to fractions of the original total'),use('A03.04','Express halves and thirds as sixths'),use('A02.01','Remove five of six original parts'),use('A02.05','Find the remaining original sixth')]),
  ratioEqualize:family({
   'difference-parts':[use('R01.02','Red and blue refer to the two ordered ratio objects'),use('A02.01','Subtract red parts from blue parts')],
   'one-part':[use('R01.05','Recover a unit part from the known quantity difference')],
   target:[use('A02.04','Multiply a unit part by the original blue parts')]
  },[[],[use('A03.02','Represent red as a fraction of blue'),use('A03.04','Convert the complementary blue fraction to an equivalent number of equal parts')]],
  [use('R01.02','Only blue is removed; red is unchanged'),use('R01.05','Use the original difference to recover a part'),use('A02.04','Both equal groups now have the original red quantity')]),
  balanceCancel:family({
   'decision-1':[use('L01.03','Remove equal box counts from both sides of a balance')],
   'extra-boxes':[use('A02.01','Count the unmatched box after equal removal')],
   target:[use('A02.03','Undo the remaining added mass to isolate one box')]
  },[[],[use('L01.02','Represent a box by an unknown'),use('L01.05','Substitute the result into both original totals'),use('A02.04','Express repeated boxes as multiples'),use('A02.06','Interpret multiplication before the added mass')]],
  [use('L01.01','Replacement mass must restore equal totals'),use('A02.01','Replace the mass of exactly one removed box')]),
  tickets:family({
   baseline:[use('A02.04','Multiply all people by the child ticket price')],
   difference:[use('A02.01','Subtract the all-child cost from the actual cost')],
   'per-change':[use('A02.01','Subtract child price from adult price')],
   target:[use('A02.05','Divide the extra cost by one ticket replacement'),use('N01.02','The replacement count has no remainder and counts whole people')]
  },[[],[use('L01.02','Represent adult count by an unknown'),use('L01.03','Solve the equality of actual and modeled costs'),use('L01.05','Check the answer against the original total'),use('A02.06','Interpret the parenthesized child count in the cost equation')]],
  [use('C02.03','Visit every bounded adult ticket count including zero'),use('N01.02','Keep only nonnegative remainders divisible by the child price'),use('A02.04','Compute adult cost for each candidate'),use('A02.01','Subtract adult cost from the fixed total'),use('A02.05','Convert remaining cost into whole child tickets')]),
  linearTable:family({
   'input-gap':[use('A02.01','Subtract the two known input values')],
   'output-gap':[use('A02.01','Subtract the corresponding output values')],
   multiplier:[use('L04.01','One fixed machine rule must fit both known pairs'),use('A02.05','Divide output change by input change')],
   addition:[use('A02.03','Undo the multiplication to recover the fixed addition')],
   target:[use('A02.04','Multiply the target input using the recovered rule')]
  },[[],[]],[use('L04.01','Preserve the same two machine constants'),use('A02.06','Reverse the order to add first and then multiply')]),
  bells:family({
   'joint-period':[use('N03.02','Find the least positive common event time')],
   'decision-1':[use('A02.01','Exclude the starting event at zero')],
   target:[use('N01.02','Only complete common periods before the inclusive end count')]
  },[[],[use('C02.03','List every common event within the specified interval')]],
  [use('N03.02','Use one complete joint period as the new interval'),use('A02.01','Count both zero and the positive endpoint')]),
  factorBalance:family({
   pairs:[use('N02.02','Enumerate every positive factor pair once')],
   'sum-*':[use('A02.01','Add the two factors in each reviewed pair')],
   target:[use('A01.04','Compare all legal pair sums to choose the minimum')]
  },[[]],[use('N02.02','Use the same complete factor-pair set'),use('A02.01','Compute the pair sum'),use('A01.04','Reverse the objective and choose the maximum')]),
  outsideAngle:family({
   'other-sum':[use('G02.03','Triangle interior angles total 180 degrees'),use('A02.01','Remove the known apex angle')],
   'base-angle':[use('G02.05','Use the stated isosceles condition, rather than visual size'),use('A02.05','Split the remaining angle equally between the bases')],
   target:[use('G02.02','Adjacent interior and exterior angles make a straight angle'),use('A02.01','Subtract the base angle from 180 degrees')]
  },[[use('A02.06','Read the parenthesized subtraction before division')],[use('A02.06','Read division before addition in the exterior-angle expression')]],
  [use('G02.02','Find the adjacent base angle by supplementing the known exterior'),use('G02.05','The other base angle is equal by the stated condition'),use('A02.01','Subtract the exterior angle from 180 degrees')]),
  circleRoute:family({
   'other-arc':[use('G04.05','The two complementary arcs partition the whole circle'),use('A02.01','Subtract clockwise segment count from the full count')],
   target:[use('A01.04','Choose the smaller of the two arc lengths'),use('A02.05','Find one equal arc length from the circumference'),use('A02.04','Multiply by the chosen segment count')]
  },[[],[]],[use('G04.05','The outbound and return complementary arcs cover every segment'),use('A02.04','Count each equal segment exactly once for the lower bound')]),
  exactlyOneSet:family({
   'only-A':[use('C01.02','Remove the intersection from the complete A group'),use('A02.01','Subtract the shared members from A')],
   'only-B':[use('C01.02','Remove the same intersection from the complete B group'),use('A02.01','Subtract the shared members from B')],
   target:[use('C01.03','Add the two mutually exclusive only-one regions')]
  },[[],[use('C01.05','Deduplicate the union before removing the intersection again')]],
  [use('C01.02','One A-only member moves into the shared region'),use('C01.03','Only-one regions lose exactly that single identity'),use('A02.01','Decrease the only-one total by one')])
 };
 catalog.exactlyOneSet.routeId='disjoint';
 Object.assign(catalog,extra.authored(use));
 Object.assign(catalog,extra.cohortThree(use));
 Object.assign(catalog,extra.cohortFour(use));
 Object.assign(catalog,final.authored(use));
 function key(id){return catalog[id]?id+'@'+catalog[id].revision:undefined}
 function get(c){const id=c.problemState?.familyId||c.recipe?.familyId||c.family;return c.skillContractKey===key(id)?catalog[id]||null:null}
 function exactFraction(value){const pair=math.arithmetic(value);if(!pair)return String(value);let [n,d]=pair;if(d<0n){n=-n;d=-d}let a=n<0n?-n:n,b=d;while(b)[a,b]=[b,a%b];return d/a===1n?String(n/a):String(n/a)+'/'+String(d/a)}
 function valueUses(value){const pair=math.arithmetic(value);return pair&&pair[0]%pair[1]!==0n?[use('A03.02','Represent this noninteger quantity as parts of one unit'),use('A03.04','Use an exact equivalent fraction for this current quantity')]:[]}
 function decimalPlaces(value){const match=String(value).match(/^[+−-]?\d*\.(\d+)$/);return match?match[1].length:0}
 function decimalTokens(text){return String(text).match(/\d*\.\d+/g)||[]}
 function textUses(text){const out=[];
  if(decimalTokens(text).some(x=>decimalPlaces(x)===1))out.push(use('A03.06','Read tenths, as represented by the ten-part A03.06 lessons'));
  if(decimalTokens(text).some(x=>decimalPlaces(x)===2))out.push(use('A04.02','Read hundredths using the fraction-percent-decimal equivalence demonstrated in A04.02 transfer'));
  for(const match of text.matchAll(/\b\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?\b/g))out.push(...valueUses(match[0]));return out;
 }
 function textKnowledgeGaps(text){return decimalTokens(text).some(x=>decimalPlaces(x)>2)?[{id:'decimal-precision-beyond-hundredths',reason:'The current A03.06 and A04.02 tasks do not establish place value beyond hundredths',message:'这里需要更高位的小数表示，当前学习范围还未覆盖。'}]:[]}
 function annotate(c,r){
  const contract=get(c);if(!contract)return null;
  const nodes=contract.revision===1?(r.id===contract.routeId?contract.nodes:null):contract.routes[r.id]?.nodes;
  if(!nodes)throw Error('Unreviewed route in skill contract '+c.family+'/'+r.id);
  const uses=[];
  for(const n of r.nodes){const entries=nodes[n.id]||Object.entries(nodes).find(([key])=>key.endsWith('*')&&n.id.startsWith(key.slice(0,-1)))?.[1];
   if(!entries?.length)throw Error('Unreviewed node in skill contract '+c.family+'/'+n.id);
   n.skillUses=[...entries,...(contract.revision===2?[...valueUses(n.answer),...textUses([n.prompt,...n.hints].join(' '))]:[])].map(x=>({...x}));uses.push(...n.skillUses);
  }
  const presented=[c.prompt,...c.options,...r.nodes.flatMap(n=>[n.prompt,...n.hints])].join(' ');
  if(contract.revision===2)uses.push(...textUses([c.prompt,...c.options].join(' ')));
  return {id:r.id,directSkills:[...new Set(uses.map(x=>x.skillId))],skillUses:uses.map(x=>({...x})),unverifiedKnowledge:[...(contract.routes?.[r.id]?.unverifiedKnowledge||[]),...textKnowledgeGaps(presented)].map(x=>({...x})),contractRevision:contract.revision,contractStatus:contract.reviewStatus};
 }
 return {catalog,key,get,annotate,valueUses,textUses,textKnowledgeGaps,decimalPlaces,exactFraction};
})(typeof module!=='undefined'?require('./problem_state'):ProblemState,typeof module!=='undefined'?require('./teaching_skill_contracts_extra'):TeachingSkillContractsExtra,typeof module!=='undefined'?require('./teaching_skill_contracts_final'):TeachingSkillContractsFinal);
if(typeof module!=='undefined')module.exports=TeachingSkillContracts;

'use strict';
const SourceCatalog=((data,registry,teaching)=>{
 const skills=new Map(data.skills.map(s=>[s.id,s]));
 function closure(ids){const out=new Set();function add(id){if(out.has(id))return;if(!skills.has(id))throw Error('Unknown required skill '+id);out.add(id);skills.get(id).prerequisiteIds.forEach(add)}ids.forEach(add);return [...out].sort()}
 function knowledgeGaps(c){const id=typeof c==='string'?c:c.problemState?.familyId||c.recipe?.familyId||c.family;return id==='signedProduct'?[{id:'negative-integer-products',reason:'The current A05 lessons do not teach the sign rules for multiplying negative integers',message:'这道题需要负数乘法的规则，当前学习范围还未覆盖。'}]:[]}
 const route=(id,direct,familyId)=>({id,directSkills:direct,requiredSkills:closure(direct),unverifiedKnowledge:knowledgeGaps(familyId||'')});
 const groupBase=['A02.01','A02.03','A02.04','A02.05','R01.01','L01.01'];
 const definitions=Object.fromEntries(registry.anchors.map(a=>[a.familyId,{examId:a.examId,configId:a.configurationId,sourceId:a.sourceId,routes:a.routes.map(r=>route(r.id,r.directSkills,a.familyId))}]));
 definitions.threeGroupBalance={configId:'main',routes:[route('reference-B',groupBase),route('direct-C',groupBase),route('ordered-trial',[...groupBase,'C02.03'])]};
 function definitionFor(id,config){const a=registry.anchors.find(a=>a.familyId===id&&a.configurationId===config);return a?{examId:a.examId,configId:a.configurationId,sourceId:a.sourceId,routes:a.routes.map(r=>route(r.id,r.directSkills,a.familyId))}:definitions[id]}
 function knownTopics(topicIds,excluded=[]){const set=new Set(topicIds),removed=new Set(excluded);return data.skills.filter(s=>set.has(s.unitId)&&!removed.has(s.id)).map(s=>s.id)}
 function profile(settings={}){
  if(!settings||typeof settings!=='object')settings={};
  const selected=new Set(Array.isArray(settings.topicIds)?settings.topicIds:[]),excluded=new Set(Array.isArray(settings.excludedSkillIds)?settings.excludedSkillIds:[]);
  const topicIds=data.units.filter(u=>selected.has(u.id)).map(u=>u.id),excludedSkillIds=data.skills.filter(s=>excluded.has(s.id)).map(s=>s.id);
  return {profileVersion:1,knowledgeStatus:'user-declared',topicIds,excludedSkillIds,declaredSkillIds:knownTopics(topicIds,excludedSkillIds),
   sourceIds:Array.isArray(settings.sourceIds)?[...new Set(settings.sourceIds.filter(id=>registry.banks.some(b=>b.id===id)))]:['AMC8'],
   examIds:Array.isArray(settings.examIds)?[...new Set(settings.examIds.filter(id=>/^AMC8-\d{4}-\d{2}$/.test(id)))]:[],
   maxCalculationLoad:[1,2].includes(settings.maxCalculationLoad)?settings.maxCalculationLoad:null,
   maxReadingLoad:[1,2].includes(settings.maxReadingLoad)?settings.maxReadingLoad:null};
 }
 function allowedRoutes(routes,mastered){const set=new Set(mastered);return routes.filter(r=>!r.unverifiedKnowledge?.length&&r.requiredSkills.every(id=>set.has(id)))}
 function taskRoutes(task){
  if(task.competition.integrated)return task.competition.routes.map(r=>({...r,directSkills:r.requiredSkills,requiredSkills:closure(r.requiredSkills),unverifiedKnowledge:[]}));
  const reviewed=teaching.get(task.competition);
  if(reviewed)return task.competition.routes.map(r=>{const x=reviewedRoute(task.competition,r),gaps=knowledgeGaps(task.competition);return {...x,unverifiedKnowledge:gaps.length?gaps:x.unverifiedKnowledge}});
  const c=task.competition,base=closure(data.skills.filter(s=>(c.topicIds||[]).includes(s.unitId)).map(s=>s.id));
  const common=[c.prompt,c.extension.prompt,c.answer,c.extension.answer].join(' ');
  const extras=text=>{
   const ids=[];if(/[-−]?\d+\s*\/\s*\d+/.test(text))ids.push('A03.02','A03.04');
   ids.push(...teaching.textUses(text).map(x=>x.skillId));
   return ids;
  };
  return (c.routes||[]).map(r=>{const text=common+' '+r.nodes.map(n=>n.answer+' '+n.hints.join(' ')).join(' ');return {id:r.id,unverifiedKnowledge:[...knowledgeGaps(c),...teaching.textKnowledgeGaps(text)],requiredSkills:closure([...(c.sourceProvenance?.matchType==='full_structure'||c.family==='threeGroupBalance'?r.requiredSkills:[...base,...r.requiredSkills]),...extras(text)])}});
 }
 function reviewedRoute(c,r){const contract=teaching.annotate(c,r);return contract?{...contract,requiredSkills:closure(contract.directSkills)}:null}
 function teachingScope(task,settings){
  const c=task.competition,contract=teaching.get(c);if(!contract)return null;
  const methodDefinitions=contract.revision===1?contract.methodExtras.map(extras=>({routeId:contract.routeId,extras})):contract.methods;
  if(methodDefinitions.length!==c.methods.length)throw Error('Unreviewed solution method '+c.family);
  const declared=new Set(profile(settings).declaredSkillIds),routes=taskRoutes(task);
  const methods=methodDefinitions.map((m,index)=>{const main=routes.find(r=>r.id===m.routeId);if(!main)throw Error('Unknown method route '+c.family+'/'+m.routeId);const text=c.methods[index].steps.join(' '),uses=[...m.extras,...(contract.revision===2?teaching.textUses(text):[])];return {index,routeId:m.routeId,useRouteFrames:m.useRouteFrames===true,requiredSkills:closure([...main.directSkills,...uses.map(x=>x.skillId)]),skillUses:uses,unverifiedKnowledge:[...(m.unverifiedKnowledge||[]),...teaching.textKnowledgeGaps(text)].map(x=>({...x}))}});
  const definitions=c.extension.key==='remove-high-to-target-v2'?[{id:c.extension.key,uses:[...contract.variations[0].uses,{skillId:'C02.03',reason:'Enumerate the bounded remaining population'},{skillId:'N01.02',reason:'Members removed must be integer'}]}]:contract.revision===1?[{id:'original-variation',uses:contract.variation}]:contract.variations;
  const variations=definitions.map(v=>{const uses=[...v.uses,...(contract.revision===2?[...teaching.textUses(c.extension.prompt),...teaching.valueUses(c.extension.answer)]:[])],requiredSkills=closure(uses.map(x=>x.skillId)),unverifiedKnowledge=[...(v.unverifiedKnowledge||[]),...teaching.textKnowledgeGaps(c.extension.prompt)].map(x=>({...x}));return {id:v.id,requiredSkills,skillUses:uses,unverifiedKnowledge,allowed:!unverifiedKnowledge.length&&requiredSkills.every(id=>declared.has(id)),missingSkillIds:requiredSkills.filter(id=>!declared.has(id)),solution:v.solution?.(c)}});
  const selected=variations.find(v=>v.allowed)||[...variations].sort((a,b)=>a.missingSkillIds.length-b.missingSkillIds.length)[0];
  return {contractRevision:contract.revision,methods,allowedMethodIndexes:methods.filter(m=>!m.unverifiedKnowledge.length&&m.requiredSkills.every(id=>declared.has(id))).map(m=>m.index),variation:{...selected,routes:variations}};
 }
 function presentationValue(task,value,settings){const contract=teaching.get(task.competition),declared=profile(settings).declaredSkillIds,places=teaching.decimalPlaces(value),skill=places===1?'A03.06':places===2?'A04.02':null;return contract?.revision===2&&(places>2||(skill&&!declared.includes(skill))||(!places&&!declared.includes('A03.06')))?teaching.exactFraction(value):String(value)}
 function taskAllowed(task,settings){return allowedRoutes(taskRoutes(task),profile(settings).declaredSkillIds)}
 function loadsAllowed(task,settings){const c=task.competition;return (!settings.maxCalculationLoad||c.calculationLoad.level<=settings.maxCalculationLoad)&&(!settings.maxReadingLoad||c.readingLoad.level<=settings.maxReadingLoad)}
 function taskEligibility(task,settings){
  const current=profile(settings),routes=taskAllowed(task,current),provenance=task.competition.sourceProvenance||{},sourceId=provenance.sourceId||'original',reasonCodes=[];
  if(!current.sourceIds.includes(sourceId))reasonCodes.push('SOURCE_NOT_SELECTED');
  if(current.examIds.length&&!current.examIds.includes(provenance.examId))reasonCodes.push('EXAM_NOT_SELECTED');
  if(!routes.length)reasonCodes.push('NO_COMPLETE_KNOWLEDGE_ROUTE');
  if(!loadsAllowed(task,current))reasonCodes.push('LOAD_LIMIT');
  return {eligible:reasonCodes.length===0,reasonCodes,allowedRouteIds:routes.map(r=>r.id),profile:current};
 }
 const previewTasks=new Map();
 function preview(item,seed){
  const recipe={engine:3,familyId:item.id,seed,generatorRevision:item.generatorRevision||3,...(item.configurationId?{configurationId:item.configurationId}:{})},key=JSON.stringify(recipe);
  if(!previewTasks.has(key))previewTasks.set(key,(typeof module!=='undefined'?require('./competition_reviewed').competitionCreate:competitionCreate)(recipe));
  return previewTasks.get(key);
 }
 function eligible(families,settings){
  settings=profile(settings);
  const mastered=knownTopics(settings.topicIds,settings.excludedSkillIds),scope=new Set(settings.topicIds),sources=settings.sourceIds||['AMC8'],ids=new Set(settings.examIds||[]),result=[];
  for(const f of families){if(f.integrated){if(sources.includes('original')&&!ids.size)for(const configurationId of f.configurations)result.push({...f,configurationId,generatorRevision:5,sourceId:'original'});continue}const def=definitions[f.id];
   for(const a of registry.anchors.filter(a=>a.familyId===f.id)){
    if(!sources.includes(a.sourceId)||!registry.banks.some(b=>b.id===a.sourceId&&b.enabled)||!['structure_verified_local','runtime_verified','accepted'].includes(a.supplyStatus)||ids.size&&!ids.has(a.examId))continue;
    const routes=allowedRoutes(a.routes.map(r=>route(r.id,r.directSkills,a.familyId)),mastered);if(routes.length)result.push({...f,configurationId:a.configurationId,generatorRevision:a.generatorRevision,sourceId:a.sourceId,sourceExamId:a.examId,allowedRouteIds:routes.map(r=>r.id),requiredSkillsByRoute:routes});
   }
   const hasReviewed=!!teaching.catalog[f.id];
   if(sources.includes('original')&&!ids.size&&(hasReviewed||f.topicIds.every(x=>scope.has(x)))){
    // Original route scopes are conservative until per-route contracts are reviewed.
    const routes=def&&!def.examId?def.routes:[route('legacy-topic-scope',data.skills.filter(s=>f.topicIds.includes(s.unitId)).map(s=>s.id))],allowed=allowedRoutes(routes,mastered);
    const configurations=[f.id==='threeGroupBalance'?'main':undefined,...((typeof module!=='undefined'?require('./structured_recipes'):StructuredRecipes).extraConfigs[f.id]||[])];
    if(allowed.length||hasReviewed)for(const configurationId of configurations)result.push({...f,configurationId,generatorRevision:configurationId?4:f.id==='natural-weighted'?5:f.generatorRevision||3,sourceId:'original',allowedRouteIds:allowed.map(r=>r.id),requiredSkillsByRoute:allowed})
   }
  }return result.map(item=>{let task;for(const seed of [1,2,3,129,2147483647]){const t=preview(item,seed);if(taskAllowed(t,settings).length&&loadsAllowed(t,settings)){task=t;break}}return task?{...item,allowedRouteIds:taskAllowed(task,settings).map(r=>r.id),requiredSkillsByRoute:taskAllowed(task,settings)}:null}).filter(Boolean);
 }
 function explain(families,settings){
  settings=profile(settings);
  const topics=settings.topicIds||[],sourceIds=settings.sourceIds||['AMC8'],pool=eligible(families,settings),result={available:pool.length>0,count:pool.length,code:'available',message:'当前范围可开始挑战。',missingSkillIds:[]};if(pool.length)return result;
  if(!topics.length)return {...result,code:'no_topics',message:'先选你已经掌握的知识。'};
  if(!sourceIds.length)return {...result,code:'no_sources',message:'还没有选择参考来源，请勾选一种。'};
  const active=sourceIds.filter(id=>registry.banks.some(b=>b.id===id&&b.enabled));if(!active.length)return {...result,code:'source_material_missing',message:'所选来源的原始资料还未核验，暂时不能供题。'};
  if((settings.examIds||[]).length){const matching=registry.anchors.filter(a=>settings.examIds.includes(a.examId)&&sourceIds.includes(a.sourceId));if(matching.length&&matching.every(a=>knowledgeGaps(a.familyId).length))return {...result,code:'unverified_knowledge',unverifiedKnowledge:matching.flatMap(a=>knowledgeGaps(a.familyId)),message:knowledgeGaps(matching[0].familyId)[0].message+'原作答与草稿可以保留。'};return {...result,code:'exam_scope',message:'指定真题与当前知识范围没有匹配，请调整题号或已掌握范围。'};}
  if(eligible(families,{...settings,maxCalculationLoad:null,maxReadingLoad:null}).length)return {...result,code:'load_limit',message:'计算量或阅读量限制挡住了可用题，可调整这两项。'};
  const mastered=new Set(knownTopics(topics,settings.excludedSkillIds)),scope=new Set(topics),candidates=[];
  for(const f of families){const d=definitions[f.id];if(active.includes('AMC8')&&d?.examId&&f.topicIds.some(id=>scope.has(id)))candidates.push(...d.routes);if(active.includes('original')){
   if(teaching.catalog[f.id])candidates.push(...taskRoutes(preview({...f,generatorRevision:3},1)));
   else if(f.topicIds.every(id=>scope.has(id)))candidates.push(...(d&&!d.examId?d.routes:[route('legacy-topic-scope',data.skills.filter(x=>f.topicIds.includes(x.unitId)).map(x=>x.id))]));
  }}
  const missing=candidates.map(r=>r.requiredSkills.filter(id=>!mastered.has(id))).filter(x=>x.length).sort((a,b)=>a.length-b.length)[0];
  if(missing)return {...result,code:'missing_prerequisites',missingSkillIds:missing,message:'当前可用结构还需要：'+missing.slice(0,4).map(id=>skills.get(id).title).join('、')+(missing.length>4?'等知识':'')+'。只有确实已掌握时才调整范围。'};
  return {...result,code:'source_coverage_gap',message:'已核验的来源结构暂未覆盖当前选择。可以查看来源情况，或自行调整已掌握范围。'};
 }
 function provenance(id,config){const a=registry.anchors.find(a=>a.familyId===id&&a.configurationId===config);return a?{sourceId:a.sourceId,examId:a.examId,matchType:'full_structure',configurationId:config,reference:a.reference,sourceStatus:a.supplyStatus,acceptanceEvidence:[...(a.acceptanceEvidence||[])],releaseAcceptance:'pending'}:{sourceId:'original',matchType:'original',configurationId:config||'legacy-default'}}
 return {definitions,definitionFor,closure,knownTopics,profile,allowedRoutes,taskRoutes,taskAllowed,taskEligibility,teachingScope,reviewedRoute,presentationValue,skillContractKey:teaching.key,knowledgeGaps,loadsAllowed,eligible,provenance,explain,banks:registry.banks};
})(typeof module!=='undefined'?require('./skills.json'):window.__AMC8_SKILLS,typeof module!=='undefined'?require('./source_registry.json'):window.__AMC8_SOURCE_REGISTRY,typeof module!=='undefined'?require('./teaching_skill_contracts'):TeachingSkillContracts);
if(typeof module!=='undefined')module.exports=SourceCatalog;

;;
'use strict';
const ExamMapping=((data,skillData,P)=>{
 const skills=new Map(skillData.skills.map(s=>[s.id,s]));
 const canonical=value=>value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?'['+value.map(canonical).join(',')+']':'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 function closure(ids){const result=new Set();function add(id){if(result.has(id))return;if(!skills.has(id))throw Error('UNKNOWN_SKILL:'+id);result.add(id);skills.get(id).prerequisiteIds.forEach(add)}ids.forEach(add);return [...result].sort()}
 function getProblem(id,revision){const p=data.problems[id];return p&&(revision===undefined||p.mappingRevision===revision)?p:null}
 function routes(id){return (getProblem(id)?.routeIds||[]).map(id=>data.routes[id]).filter(Boolean)}
 const mathAliases=new Map();
 for(const group of data.mathAliases||[]){const key='rtm:'+canonical(group.coreMathFacts);for(const member of group.members)mathAliases.set('rtm:'+canonical(member.mathFactsSnapshot),key)}
 function resolveMathKey(key){return mathAliases.get(key)||key}
 function taskKey(task){return resolveMathKey('rtm:'+canonical(task.mathFacts))}
 function problemKey(problem){if(!problem?.mathFacts?.goal)throw Error('SEMANTIC_MATH_IDENTITY_REQUIRED');return taskKey(problem)}
 function taskAllowed(task,profile={}){
  const declared=new Set(profile.declaredSkillIds||[]),required=closure(task.requiredKnowledge||[]),missing=required.filter(id=>!declared.has(id));
  const allowed=!task.policyGaps?.length&&!missing.length&&(!profile.maxCalculationLoad||task.load.calculation<=profile.maxCalculationLoad)&&(!profile.maxReadingLoad||task.load.reading<=profile.maxReadingLoad);
  return {eligible:allowed,missingSkillIds:missing,reasonCodes:task.policyGaps?.length?['POLICY_KNOWLEDGE_GAP']:missing.length?['MISSING_KNOWLEDGE']:allowed?[]:['LOAD_LIMIT']};
 }
 function check(p,profile={},history={},mode='practice'){
  const errors=[],declared=new Set(profile.declaredSkillIds||[]);
  if(!p||p.status?.verificationStatus!=='PASS')return {eligible:false,allowedRouteIds:[],reasonCodes:['UNVERIFIED_MAPPING']};
  const allowed=routes(p.examId).filter(r=>!r.policyGaps?.length&&r.requiredSkills.every(id=>declared.has(id)));
  if(!allowed.length)errors.push(p.policyGaps?.length?'POLICY_KNOWLEDGE_GAP':'NO_COMPLETE_ALLOWED_ROUTE');
  if(p.status.publicationStatus!=='cleared'||p.status.runtimeStatus!=='eligible')errors.push('RUNTIME_DISABLED');
  if(profile.sourceIds&&!profile.sourceIds.includes(p.sourceId))errors.push('SOURCE_NOT_SELECTED');
  if(profile.examIds?.length&&!profile.examIds.includes(p.examId))errors.push('EXAM_NOT_SELECTED');
  if(p.load&&((profile.maxCalculationLoad&&p.load.calculation>profile.maxCalculationLoad)||(profile.maxReadingLoad&&p.load.reading>profile.maxReadingLoad)))errors.push('LOAD_LIMIT');
  if(mode==='exam_holdout'&&history.historyUnknown)errors.push('HISTORY_UNKNOWN');
  return {eligible:errors.length===0,allowedRouteIds:allowed.map(r=>r.routeId),reasonCodes:errors,sourceRevision:p.mappingRevision};
 }
 function sourceMatch(task,p){
  if(!p?.recipe||task?.competition?.recipe?.familyId!==p.recipe.familyId||task.competition.recipe.configurationId!==p.recipe.configurationId)return false;
  const m=task.competition.math,f=p.facts;
  if(p.recipe.familyId==='overlapAverages')return m.values?.length===f.n&&P.equal(m.values.slice(0,4).reduce((a,b)=>a+b,0)+'/4',f.averages[0])&&P.equal(m.values.slice(3).reduce((a,b)=>a+b,0)+'/4',f.averages[1])&&P.equal(m.values.reduce((a,b)=>a+b,0)+'/7',f.averages[2]);
  if(p.recipe.familyId==='digitDivisor')return m.lo===f.lo&&m.hi===f.hi&&f.strict===true&&f.zeroDivisorAllowed===false;
  if(p.recipe.familyId==='lShapeArea')return m.inner===f.smallSquareSides[1]&&m.border===f.smallSquareSides[0]&&m.border===f.smallSquareSides[2];
  if(p.recipe.familyId==='signedProduct')return canonical(m.cards)===canonical(f.cards)&&f.choose===3&&f.distinct===true;
  return false;
 }
 function match(task){return Object.values(data.problems).find(p=>sourceMatch(task,p))||null}
 return {data,canonical,closure,getProblem,routes,taskKey,problemKey,resolveMathKey,taskAllowed,check,sourceMatch,match};
})(typeof module!=='undefined'?require('./exam_runtime_index.json'):window.__AMC8_EXAM_MAPPING,typeof module!=='undefined'?require('./skills.json'):window.__AMC8_SKILLS,typeof module!=='undefined'?require('./problem_state'):ProblemState);
if(typeof module!=='undefined')module.exports=ExamMapping;

'use strict';
const JudgmentEvidence=((P)=>{
 const MAX_INPUT=1000,MAX_ITEMS=100;
 function evaluate(contract,response,support={}){
  const raw=String(response??'').trim(),unknown=()=>({outcome:'UNRECOGNIZED',level:null,reason:'输入已保留，尚未自动核验。'});
  if(!contract||!raw||raw.length>MAX_INPUT)return unknown();
  let correct=false;
  if(contract.kind==='rational'){
   if(raw.length>160||P.arithmetic(raw)===null)return unknown();
   correct=P.equal(raw,String(contract.expected));
  }else if(contract.kind==='choice')correct=raw===String(contract.expected);
  else if(['set','vector'].includes(contract.kind)){
   const parts=raw.split(/[,，;；\s]+/).filter(Boolean);
   if(parts.length>MAX_ITEMS||parts.some(p=>!/^[-+]?\d{1,9}$/.test(p)))return unknown();
   const values=parts.map(Number),expected=contract.expected;
   if(!Array.isArray(expected))return unknown();
   correct=values.length===expected.length&&(contract.kind==='set'?
    new Set(values).size===values.length&&expected.every(v=>values.includes(v)):
    values.every((v,i)=>v===expected[i]));
  }else return unknown();
  const helped=Number(support.methodHelpCount||0)>0||support.answerRevealed===true||support.methodExposed===true;
  return {outcome:correct?'VERIFIED':'INCORRECT',level:correct?(helped?'E1':'E2'):null,
   evidenceScope:support.evidenceScope||'local_decision_prompt',methodAssisted:helped};
 }
 function task(task,response,support={}){
  const result=evaluate(task?.answerContract,response,support);
  if(result.outcome==='VERIFIED'&&task.grantsJudgmentEvidence!==true)return {...result,level:null,evidenceScope:'outcome_only'};
  return result;
 }
 return {evaluate,task,MAX_INPUT,MAX_ITEMS};
})(typeof module!=='undefined'?require('./problem_state'):ProblemState);
if(typeof module!=='undefined')module.exports=JudgmentEvidence;

'use strict';
const TransferEvidenceStore=((Mapping)=>{
 const SCHEMA=1;
 const TYPES=new Set(['problem_presented','original_figure_presented','statement_read_requested','response_submitted','hint_revealed','hint_read_requested','method_exposed','answer_revealed','diagnostic_probe_submitted','mode_changed','attempt_finished']);
 const copy=value=>JSON.parse(JSON.stringify(value));
 function fresh(){return {schemaVersion:SCHEMA,eventsById:{},sessions:{}}}
 // A borrowed read view: validate on every read, including nested edits. Callers
 // must use restore() or append() before changing any part of this record.
 function inspect(value){
  if(value===undefined||value===null)return {state:fresh(),readOnly:false,historyUnknown:false};
  if(typeof value!=='object'||Array.isArray(value)||value.schemaVersion!==SCHEMA||!value.eventsById||Array.isArray(value.eventsById)||typeof value.eventsById!=='object'||!value.sessions||typeof value.sessions!=='object'||Array.isArray(value.sessions))return {state:null,readOnly:true,historyUnknown:true,retainedOriginal:value};
  const ordinals=new Set();
  for(const [id,e] of Object.entries(value.eventsById)){
   if(!valid(e)||id!==e.eventId||!Number.isInteger(e.recordOrdinal)||e.recordOrdinal<1||ordinals.has(e.recordOrdinal))return {state:null,readOnly:true,historyUnknown:true,retainedOriginal:value};
   ordinals.add(e.recordOrdinal);
  }
  return {state:value,readOnly:false,historyUnknown:false};
 }
 function restore(value){
  const r=inspect(value);
  return r.readOnly?{...r,retainedOriginal:copy(r.retainedOriginal)}:{...r,state:copy(r.state)};
 }
 function valid(e){return !!e&&typeof e==='object'&&typeof e.eventId==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,199}$/.test(e.eventId)&&!['__proto__','constructor','prototype'].includes(e.eventId)&&
  TYPES.has(e.type)&&typeof e.attemptId==='string'&&typeof e.mathKey==='string'&&e.mathKey.length<=10000&&
  Number.isInteger(e.sequence)&&e.sequence>=1&&Number.isFinite(e.at)&&e.at>0&&typeof e.mappingBuildId==='string'&&
  (e.type!=='response_submitted'||Number.isInteger(e.submissionOrdinal)&&e.submissionOrdinal>=1)}
 function append(state,e){
  if(!state||state.schemaVersion!==SCHEMA||!valid(e))return {ok:false,reason:'INVALID_OR_FUTURE_EVIDENCE',state};
  const old=state.eventsById[e.eventId],incoming=copy(e);delete incoming.recordOrdinal;
  if(old){const prior=copy(old);delete prior.recordOrdinal;return JSON.stringify(prior)===JSON.stringify(incoming)?{ok:true,duplicate:true,state}:{ok:false,reason:'EVENT_ID_CONFLICT',state}}
  const next=copy(state),last=Math.max(0,...Object.values(state.eventsById).map(e=>e.recordOrdinal||0));next.eventsById[e.eventId]={...incoming,recordOrdinal:last+1};return {ok:true,duplicate:false,state:next};
 }
 function events(state){return Object.values(state?.eventsById||{}).sort((a,b)=>a.recordOrdinal-b.recordOrdinal)}
 function summarizeAttempt(rows){
  const responses=rows.filter(e=>e.type==='response_submitted').sort((a,b)=>a.submissionOrdinal-b.submissionOrdinal||a.sequence-b.sequence);
  const ordinals=responses.map(e=>e.submissionOrdinal),conflict=new Set(ordinals).size!==ordinals.length;
  const first=conflict?null:responses[0]||null;
  return {events:rows,firstSubmission:first,firstSubmissionConflict:conflict,
   latestSubmission:responses.at(-1)||null,solved:responses.some(e=>e.result?.outcome==='VERIFIED'),
   helpCount:rows.filter(e=>['hint_revealed','hint_read_requested','method_exposed','answer_revealed'].includes(e.type)).length};
 }
 function attempt(state,id){return summarizeAttempt(events(state).filter(e=>e.attemptId===id))}
 function history(state,legacy={}){
  const rows=events(state),solved=new Set((legacy.solvedMathKeys||[]).map(Mapping.resolveMathKey)),exposed=new Set((legacy.exposedMathKeys||[]).map(Mapping.resolveMathKey)),origins=new Set(legacy.exposedOriginGroups||[]),assistedOrigins=new Set(legacy.assistedOriginGroups||[]);
  for(const e of rows){
   if(e.type==='problem_presented'){exposed.add(Mapping.resolveMathKey(e.mathKey));if(e.originProblemGroupId)origins.add(e.originProblemGroupId)}
   if(e.type==='response_submitted'&&e.evidenceScope!=='remediation_support_only'&&!e.diagnosticOf&&e.result?.outcome==='VERIFIED')solved.add(Mapping.resolveMathKey(e.mathKey));
   if(['hint_revealed','hint_read_requested','method_exposed','answer_revealed'].includes(e.type)&&e.originProblemGroupId)assistedOrigins.add(e.originProblemGroupId);
  }
  return {solvedMathKeys:[...solved],exposedMathKeys:[...exposed],exposedOriginGroups:[...origins],assistedOriginGroups:[...assistedOrigins],historyUnknown:legacy.historyUnknown===true};
 }
 function instance(state,mathKey){const key=Mapping.resolveMathKey(mathKey),rows=events(state).filter(e=>Mapping.resolveMathKey(e.mathKey)===key);return {events:rows,firstSubmission:rows.find(e=>e.type==='response_submitted')||null,methodExposed:rows.some(e=>['hint_revealed','hint_read_requested','method_exposed','answer_revealed'].includes(e.type))}}
 function supersededOriginal(row){
  const p=Mapping.getProblem(row?.examId||row?.originProblemGroupId),old=p?.sourceCorrection?.supersedes?.previousFacts;
  return !!old&&['original','equivalent_translation'].includes(row?.presentationKind)&&Mapping.resolveMathKey(row.mathKey)===Mapping.problemKey({mathFacts:old})&&Mapping.resolveMathKey(row.mathKey)!==Mapping.problemKey(p);
 }
 function statistics(state){
  const rows=events(state),ids=[...new Set(rows.filter(e=>e.type==='problem_presented').map(e=>e.attemptId))];
  const byAttempt=new Map(),byMath=new Map();
  for(const e of rows){const key=Mapping.resolveMathKey(e.mathKey);if(!byAttempt.has(e.attemptId))byAttempt.set(e.attemptId,[]);byAttempt.get(e.attemptId).push(e);if(!byMath.has(key))byMath.set(key,[]);byMath.get(key).push(e)}
  let correct=0,submitted=0,helped=0,skipped=0,pending=0,originals=0,holdoutSubmitted=0,holdoutCorrect=0,holdoutHelpConversions=0,historicalSourceCorrected=0;const counted=new Set(),holdoutCounted=new Set();
  for(const id of ids){const a=summarizeAttempt(byAttempt.get(id)),shown=a.events.find(e=>e.type==='problem_presented');
   const superseded=supersededOriginal(shown);if(superseded)historicalSourceCorrected++;
   if(shown.presentationKind==='original'||shown.presentationKind==='equivalent_translation')originals++;
   const key=Mapping.resolveMathKey(shown.mathKey),same={events:byMath.get(key)},firstShown=same.events.find(e=>e.type==='problem_presented');same.firstSubmission=same.events.find(e=>e.type==='response_submitted');
   if(a.firstSubmission&&!counted.has(key)){counted.add(key);const first=same.firstSubmission;submitted++;if(!superseded&&first?.result?.outcome==='VERIFIED'&&!first.supportSnapshot?.methodHelpCount&&!firstShown?.priorExposure&&!same.events.some(e=>e.recordOrdinal<first.recordOrdinal&&['hint_revealed','hint_read_requested','method_exposed','answer_revealed'].includes(e.type)))correct++;}
   if(a.helpCount)helped++;
   if(shown.mode==='exam_holdout'){
    if(a.events.some(e=>e.type==='mode_changed'&&e.fromMode==='exam_holdout'&&e.toMode==='practice'))holdoutHelpConversions++;
    if(a.firstSubmission&&!holdoutCounted.has(key)){
     holdoutCounted.add(key);holdoutSubmitted++;
     const earlierExposure=same.events.some(e=>e.recordOrdinal<shown.recordOrdinal);
     if(!superseded&&['original','equivalent_translation'].includes(shown.presentationKind)&&!shown.priorExposure&&!earlierExposure&&a.firstSubmission.result?.outcome==='VERIFIED'&&!a.firstSubmission.supportSnapshot?.methodHelpCount)holdoutCorrect++;
    }
   }
   if(a.events.some(e=>e.type==='attempt_finished'&&e.reason==='skipped'))skipped++;
   if(!a.firstSubmission&&!a.events.some(e=>e.type==='attempt_finished'))pending++;
  }
  return {shown:ids.length,submitted,firstUnassistedCorrect:correct,helped,skipped,inProgress:pending,originals,
   holdoutSubmitted,holdoutFirstUnassistedCorrect:holdoutCorrect,holdoutHelpConversions,historicalSourceCorrected,learningEffect:'NOT_MEASURED'};
 }
 return {SCHEMA,fresh,inspect,restore,valid,append,events,attempt,instance,history,supersededOriginal,statistics};
})(typeof module!=='undefined'?require('./exam_mapping'):ExamMapping);
if(typeof module!=='undefined')module.exports=TransferEvidenceStore;

'use strict';
const TransferPolicy=((Mapping)=>{
 function check(candidate,history={},mode='practice'){
  const reasons=[],key=Mapping.resolveMathKey(candidate.mathKey),solved=new Set((history.solvedMathKeys||[]).map(Mapping.resolveMathKey)),seen=new Set((history.exposedMathKeys||[]).map(Mapping.resolveMathKey)),origins=new Set(history.exposedOriginGroups||[]);
  if(mode==='history_review')return {eligible:true,reasonCodes:[]};
  if(solved.has(key))reasons.push('ALREADY_SOLVED');
  if(mode==='exam_holdout'){
   if(!['original','equivalent_translation'].includes(candidate.presentationKind))reasons.push('NOT_VERIFIED_ORIGINAL');
   if(history.historyUnknown)reasons.push('HISTORY_UNKNOWN');
   if(seen.has(key)||origins.has(candidate.originProblemGroupId))reasons.push('HOLDOUT_CONTAMINATED');
  }
  if(mode==='transfer'&&seen.has(key))reasons.push('INSTANCE_ALREADY_SEEN');
  return {eligible:reasons.length===0,reasonCodes:reasons};
 }
 function allocate(candidates,history,mode='practice',seed=1){
  const eligible=[],rejected=[];
  for(const c of candidates){const result=check(c,history,mode);(result.eligible?eligible:rejected).push(result.eligible?c:{id:c.id,reasons:result.reasonCodes})}
  if(!eligible.length)return {candidateRef:null,reasonCodes:['NO_ELIGIBLE_SUPPLY'],rejected};
  const selected=eligible[(Math.abs(Number(seed)||1)-1)%eligible.length];
  return {candidateRef:selected,reasonCodes:[],rejected,eligibleCount:eligible.length};
 }
 function preparePathway(originals,training,history,seed=1){
  const originalById=new Map(originals.map(p=>[p.examId,p]));
  const trainingById=new Map(training.map(t=>[t.id,t]));
  const plans=[];
  for(const set of Object.values(Mapping.data.transferSets)){
   const available=set.trainingTaskIds.map(id=>trainingById.get(id)).filter(t=>t&&check(t,history,'practice').eligible);
   if(!available.length)continue;
   const order={decision:0,contrast:1,representation_transfer:2,integration:3,delayed_check:4};
   available.sort((a,b)=>(order[a.definition.role]??9)-(order[b.definition.role]??9)||a.id.localeCompare(b.id));
   const targets=set.holdoutExamIds.map(id=>originalById.get(id)).filter(p=>p&&check(p,history,'exam_holdout').eligible);
   for(const target of targets)plans.push({transferSetId:set.transferSetId,trainingExamId:set.examId,
    structureClusterId:set.structureClusterId,taskIds:available.map(t=>t.id),holdoutExamId:target.examId,
    holdoutMathKey:target.mathKey,holdoutOriginProblemGroupId:target.originProblemGroupId,
    assignmentVersion:1,mappingBuildId:Mapping.data.mappingBuildId});
  }
  if(!plans.length)return {plan:null,reasonCodes:['NO_MATCHED_UNSEEN_HOLDOUT']};
  return {plan:plans[(Math.abs(Number(seed)||1)-1)%plans.length],reasonCodes:[]};
 }
 function reservedTarget(plan,originals,history){
  if(!plan||plan.mappingBuildId!==Mapping.data.mappingBuildId)return {candidateRef:null,reasonCodes:['ASSIGNMENT_REVISION_CHANGED']};
  const target=originals.find(p=>p.examId===plan.holdoutExamId&&p.mathKey===plan.holdoutMathKey);
  if(!target)return {candidateRef:null,reasonCodes:['RESERVED_HOLDOUT_OUTSIDE_CURRENT_SCOPE']};
  const status=check(target,history,'exam_holdout');
  return {candidateRef:status.eligible?target:null,reasonCodes:status.reasonCodes};
 }
 function delayStatus(from,to,days){return !Number.isFinite(from)||!Number.isFinite(to)||from<=0||to<from?'unknown':to-from>=days*86400000?'due':'not_due'}
 return {check,allocate,preparePathway,reservedTarget,delayStatus};
})(typeof module!=='undefined'?require('./exam_mapping'):ExamMapping);
if(typeof module!=='undefined')module.exports=TransferPolicy;


;
;
'use strict';
// Separately reviewed teaching scaffolds, bound to unchanged mathematical data
// and the exact previously approved presentation. No learner diagnosis or grant.
const TaskScaffoldReview = (() => {
 const copy = x => JSON.parse(JSON.stringify(x));
 const canonical = x => x === null || typeof x !== 'object' ? JSON.stringify(x) : Array.isArray(x) ? '[' + x.map(canonical).join(',') + ']' : '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
 const same = (a,b) => canonical(a) === canonical(b);
 const fields = (x,keys) => Object.fromEntries(keys.filter(k => k in x).map(k => [k,x[k]]));
 function snapshot(data,reviews,id) {
  const t = data.tasks[id],p = data.problems[t?.originProblemGroupId || id],r = reviews.problems[p?.examId];
  if (!p || !r || t && !r.tasks[id]) return null;
  const source = t || p, row = t ? r.tasks[id] : r, d = {...(t || p.presentation),...row};
  return {
   source:fields(source,t ? ['taskId','contentRevision','prompt','answerContract','mathFacts','requiredKnowledge','role','load','options','hints','givenText','givenFigures','givenTable','policyGaps','grantsJudgmentEvidence'] : ['examId','mathFacts','facts','answerContract','presentation','recipe','load','mappingRevision','sourceId','policyGaps','routeIds','trainingBindingIds','originProblemGroupId','status']),
   presentation:{prompt:d.prompt || '',givenText:d.givenText || '',options:d.options || [],hints:d.hints || [],givenFigures:d.givenFigures || [],givenTable:d.givenTable || []}
  };
 }
 function create(data,reviews,registry) {
  function project(p,base) {
   const entries = registry?.entries;
   if (registry?.schema !== 1 || !entries || typeof entries !== 'object' || Array.isArray(entries)) return {ok:false,reason:'SCAFFOLD_REGISTRY_UNVERIFIED'};
   const rows = Object.entries(entries).filter(([,r]) => r.originProblemGroupId === p.examId);
   if (!rows.length) return {ok:true,record:base,applied:[]};
   let result = copy(base);const applied = [];
   for (const [id,r] of rows) {
    const current = snapshot(data,reviews,id);
    const text = s => typeof s === 'string' && s.trim().length > 0;
    if (r.taskId !== id || r.status !== 'EXPLICIT_SOFTWARE_REVIEWED' || r.legacyReadinessPolicy !== 'EXACT_BASE_PREPARATION_ONLY' || !text(r.reviewId) || !text(r.misconception) || !text(r.independentDerivation) || !text(r.scaffoldRationale) ||
        !current || !same(current,r.baseSnapshot) || !Array.isArray(r.hints) || r.hints.length !== 2 || r.hints.some(h => !text(h)) || r.hints[0] === r.hints[1] || !same(r.hints,r.reviewedHints)) return {ok:false,reason:'SCAFFOLD_REVIEW_STALE',taskId:id};
    if (id === p.examId) result.hints = copy(r.hints);
    else if (data.tasks[id]?.originProblemGroupId === p.examId && result.tasks[id]) result.tasks[id].hints = copy(r.hints);
    else return {ok:false,reason:'SCAFFOLD_SCOPE_INVALID',taskId:id};
    applied.push(r.reviewId);
   }
   return {ok:true,record:result,applied};
  }
  return {project};
 }
 return {snapshot,create};
})();
if (typeof module !== 'undefined') module.exports = TaskScaffoldReview;

'use strict';
// One projection serves delivery, parent counts and exported audit tables.
const ChildReviewStatus=(()=>{
 const Scaffolds=typeof module!=='undefined'?require('./task_scaffold_review'):TaskScaffoldReview;
 const scaffoldRegistry=typeof module!=='undefined'?require('./task_scaffold_reviews.json'):window.__AMC8_TASK_SCAFFOLDS;
 const routeKeys=['routeId','examId','routeRevision','requiredKnowledge','requiredSkills','policyGaps','judgmentIds','integrationTaskIds','counterexampleTaskIds'];
 const bindingKeys=['bindingId','examId','judgmentId','taskRef','role','matchLevel','policyGaps','evidenceScope'];
 const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
 const fields=(x,keys)=>Object.fromEntries(keys.filter(k=>k in x).map(k=>[k,x[k]]));
 const clone=x=>JSON.parse(JSON.stringify(x));
 function label(checked){
  if(checked?.status==='REVIEWED')return '题目形式已审通过';
  if(checked?.status==='REVIEWED_RESTRICTED')return '题目形式已审受限'+(checked.record?.restrictionReason?'：'+checked.record.restrictionReason:'');
  if(checked?.status==='STALE')return '题目形式变更需复审';
  if(checked?.status==='UNMAPPED')return '映射待核验';
  return '题目形式待审';
 }
 function recipePresentationSnapshot(p){
  try{
   const C=typeof module!=='undefined'?require('./competition_reviewed'):null,D=typeof module!=='undefined'?require('./competition_content_contracts'):CompetitionContentContracts;
   const t=C?C.competitionCreate(p.recipe):competitionCreate(p.recipe),d=D.resolve(t);
   return clone({recipe:t.competition.recipe,math:t.competition.math,presentation:d,diagram:t.competition.diagram||null});
  }catch{return {invalidRecipe:true}}
 }
 function create(data,reviews,options={}){
  const scaffolds=Scaffolds.create(data,reviews,options.scaffoldReviews||scaffoldRegistry);
  let taskIndex=null,taskCount=-1;
  let reviewSnapshot=null;
  // Cache within this synchronous read only. The next operation revalidates
  // source content, approvals, routes, bindings and available assets.
  function withReviewSnapshot(read){if(reviewSnapshot)return read();reviewSnapshot=new Map();try{return read()}finally{reviewSnapshot=null}}
  function taskIds(eid){const count=Object.keys(data.tasks).length;if(taskCount!==count){taskIndex={};for(const t of Object.values(data.tasks))(taskIndex[t.originProblemGroupId]??=[]).push(t.taskId);taskCount=count}return (taskIndex[eid]||[]).slice().sort()}
  function problemSnapshot(p){return {examId:p.examId,mathFacts:p.mathFacts||p.facts||null,answerContract:p.answerContract,presentation:p.presentation||null,recipe:p.recipe||null,...(p.sourceCorrection?{sourceCorrection:p.sourceCorrection}:{}),...(p.recipe?{recipePresentation:recipePresentationSnapshot(p)}:{}),load:p.load||null,routeIds:p.routeIds,routes:p.routeIds.map(id=>fields(data.routes[id],routeKeys)),bindings:p.trainingBindingIds.map(id=>fields(data.bindings[id],bindingKeys))}}
  function taskSnapshot(t){return fields(t,['taskId','contentRevision','prompt','answerContract','mathFacts','requiredKnowledge','role','load','options','hints','givenText','givenFigures','givenTable'])}
  function definition(candidate,row){const result=clone(candidate.definition);for(const key of ['prompt','givenText','givenFigures','givenTable','options','hints','renderingMode'])if(row[key]!==undefined)result[key]=clone(row[key]);return result}
  function assetReady(f){
   if(options.assetReady)return options.assetReady(f);
   if(typeof window!=='undefined')return !!window.__AMC8_SOURCE_FIGURES?.[f.sha256];
   if(options.checkFiles){try{const fs=require('fs'),path=require('path'),crypto=require('crypto'),root=path.resolve(__dirname,'..'),target=path.resolve(root,f.path);return target.startsWith(root+'/source/content/')&&crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')===f.sha256}catch{return false}}
   return true;
  }
  function evaluate(p){
   if(!p)return {eligible:false,status:'UNMAPPED',reasonCodes:['MAPPING_REVIEW_PENDING']};
   const r=reviews.problems[p.examId];
   if(!r||!['REVIEWED','REVIEWED_RESTRICTED'].includes(r.status))return {eligible:false,status:'PENDING',reasonCodes:['CHILD_FORM_REVIEW_PENDING']};
   if(canonical(problemSnapshot(p))!==canonical(r.problemSnapshot))return {eligible:false,status:'STALE',reasonCodes:['CHILD_FORM_REVIEW_STALE']};
   if(canonical(taskIds(p.examId))!==canonical(Object.keys(r.tasks||{}).sort()))return {eligible:false,status:'STALE',reasonCodes:['CHILD_TASK_SET_CHANGED']};
   for(const [id,row] of Object.entries(r.tasks))if(!data.tasks[id]||canonical(taskSnapshot(data.tasks[id]))!==canonical(row.taskSnapshot))return {eligible:false,status:'STALE',reasonCodes:['CHILD_TASK_REVIEW_STALE']};
   if(r.status==='REVIEWED_RESTRICTED')return {eligible:false,status:'REVIEWED_RESTRICTED',reasonCodes:['CHILD_FORM_REVIEW_RESTRICTED'],record:r};
   for(const row of [{...p.presentation,...r},...Object.values(r.tasks)])if((row.givenFigures||[]).some(f=>!assetReady(f)))return {eligible:false,status:'STALE',reasonCodes:['CHILD_FORM_ASSET_MISSING_OR_CHANGED']};
   const scaffold=scaffolds.project(p,r);
   if(!scaffold.ok)return {eligible:false,status:'STALE',reasonCodes:[scaffold.reason]};
   return {eligible:true,status:'REVIEWED',reasonCodes:[],record:scaffold.record};
  }
  function review(p){if(reviewSnapshot?.has(p))return reviewSnapshot.get(p);const checked=evaluate(p);if(reviewSnapshot)reviewSnapshot.set(p,checked);return checked}
  function projection(){return Object.keys(data.registeredProblems).sort().map(eid=>{const registered=data.registeredProblems[eid],checked=review(data.problems[eid]);return {examId:eid,mappingVerification:registered.status.verificationStatus,mappingRuntimeStatus:registered.status.runtimeStatus,childFormStatus:checked.status,automaticPoolCandidate:checked.eligible&&registered.status.runtimeStatus==='eligible',reasonCode:checked.reasonCodes.join(';')||'REVIEWED',restrictionReason:checked.record?.restrictionReason||''}})}
  function coverage(){const rows=projection(),count=status=>rows.filter(r=>r.childFormStatus===status).length;return {registered:rows.length,unmapped:count('UNMAPPED'),mapped:Object.keys(data.problems).length,reviewed:count('REVIEWED'),restricted:count('REVIEWED_RESTRICTED'),stale:count('STALE'),pending:count('PENDING'),assessed:count('REVIEWED')+count('REVIEWED_RESTRICTED')}}
  return {problemSnapshot,taskSnapshot,definition,review,projection,coverage,withReviewSnapshot};
 }
 const value=typeof module!=='undefined'?create(require('./exam_runtime_index.json'),require('./child_form_reviews.json'),{checkFiles:true}):create(window.__AMC8_EXAM_MAPPING,window.__AMC8_CHILD_FORMS);
 return {...value,create,recipePresentationSnapshot,label};
})();
if(typeof module!=='undefined')module.exports=ChildReviewStatus;

'use strict';
// A correct local decision is preparation for application, not a mastery claim.
const ConnectedLearning=((M,P,S,reviews)=>{
 const copy=x=>JSON.parse(JSON.stringify(x));
 const R=typeof module!=='undefined'?require('./child_review_status'):ChildReviewStatus;
 const scaffolds=typeof module!=='undefined'?require('./task_scaffold_reviews.json'):window.__AMC8_TASK_SCAFFOLDS;
 const Evidence=typeof module!=='undefined'?require('./judgment_evidence'):JudgmentEvidence;
 const skillData=typeof module!=='undefined'?require('./skills.json'):window.__AMC8_SKILLS;
 const skillUnit=new Map(skillData.skills.map(skill=>[skill.id,skill.unitId]));
 const {problemSnapshot,taskSnapshot,definition}=R;
 function taskEvidenceKey(t,presented){const row=presented?null:R.review(M.getProblem(t.originProblemGroupId)).record?.tasks[t.taskId],d=presented||{...t,...row};return M.canonical({task:taskSnapshot(t),presentedPrompt:d.prompt,presentedGivens:d.givenText||'',presentedOptions:d.options||t.options,presentedHints:d.hints,presentedFigures:d.givenFigures||[],presentedTable:d.givenTable||[]})}
 function review(p){
  return R.review(p);
 }
 function routeTopics(routeId){
  const route=M.data.routes[routeId];
  return [...new Set((route?.requiredKnowledge||[]).map(id=>skillUnit.get(id)).filter(Boolean))];
 }
 function focusPlans(prepared,profile){
  // Explicitly specified examination problems remain exact. When broader
  // topics were selected, use their direct knowledge rather than treating
  // arithmetic prerequisites as the only goal of every group.
  if((profile?.examIds||[]).length)return prepared;
  const focus=(profile?.topicIds||[]).filter(id=>id!=='A01'&&id!=='A02');
  if(!focus.length)return prepared;
  const selected=new Set(focus);
  return prepared.filter(plan=>(plan.focusTopics||routeTopics(plan.routeId)).some(id=>selected.has(id)));
 }
 function success(state,t,checked=null){
  checked=checked||R.review(M.getProblem(t.originProblemGroupId));if(!checked.eligible)return null;
  const key=taskEvidenceKey(t,{...t,...checked.record.tasks[t.taskId]}),mathKey=M.taskKey(t);
  const scaffold=scaffolds.entries[t.taskId],legacyKey=scaffold?.legacyReadinessPolicy==='EXACT_BASE_PREPARATION_ONLY'?taskEvidenceKey(t,scaffold.baseSnapshot.presentation):null;
  const row=S.events(state).find(e=>e.type==='response_submitted'&&e.evidenceScope!=='remediation_support_only'&&!e.diagnosticOf&&e.result?.outcome==='VERIFIED'&&(e.taskEvidenceKey===key||legacyKey&&e.taskEvidenceKey===legacyKey&&Evidence.task(t,e.input).outcome==='VERIFIED')&&e.taskId===t.taskId&&M.resolveMathKey(e.mathKey)===mathKey);
  if(!row)return null;
  const first=S.instance(state,mathKey).firstSubmission;
  return {taskId:t.taskId,eventId:row.eventId,attemptId:row.attemptId,firstSubmissionEventId:first?.eventId||null,firstCorrect:first?.result?.outcome==='VERIFIED',usedHelp:!!row.supportSnapshot?.methodHelpCount,...(row.taskEvidenceKey!==key?{legacyPresentationReuse:{scope:'exact_base_local_preparation_only',grantsNewScaffoldObservation:false,independent:false}}:{})};
 }
 function plans(originals,training,profile,history,state){
  const byId=new Map(training.map(t=>[t.id,t])),result=[];
  const bindingsByJudgment=new Map();for(const binding of Object.values(M.data.bindings)){const rows=bindingsByJudgment.get(binding.judgmentId)||[];rows.push(binding);bindingsByJudgment.set(binding.judgmentId,rows)}
  for(const c of originals){
   if(!P.check(c,history,'practice').eligible)continue;
   const p=M.getProblem(c.examId),checked=review(p);if(!checked.eligible)continue;
   const allowed=M.check(p,profile,history,'practice');if(!allowed.eligible)continue;
   const r=checked.record;
   for(const routeId of allowed.allowedRouteIds){
    const route=M.data.routes[routeId],ids=[];let valid=true;
    for(const judgmentId of route.judgmentIds){
     const binding=(bindingsByJudgment.get(judgmentId)||[]).find(b=>['PARTIAL_DECISION','FULL_STRUCTURE'].includes(b.matchLevel)&&!b.policyGaps?.length&&byId.has(b.taskRef.taskId)&&r.tasks[b.taskRef.taskId]&&M.data.tasks[b.taskRef.taskId].contentRevision===b.taskRef.contentRevision);
     if(!binding){valid=false;break}ids.push(binding.taskRef.taskId);
    }
    if(!valid||!route.integrationTaskIds.length)continue;
    ids.push(...route.counterexampleTaskIds,...route.integrationTaskIds);
    const taskIds=[...new Set(ids)];
    if(!taskIds.every(id=>byId.has(id)&&r.tasks[id]&&M.taskAllowed(M.data.tasks[id],profile).eligible))continue;
    const evidence=taskIds.map(id=>success(state,M.data.tasks[id],checked)).filter(Boolean);
    const pendingTaskIds=taskIds.filter(id=>!evidence.some(e=>e.taskId===id));
    // Solved duplicates may be excluded without importing an unreviewed
    // cross-task judgment correspondence as readiness evidence.
    if(pendingTaskIds.some(id=>!P.check(byId.get(id),history,'practice').eligible))continue;
    result.push({examId:p.examId,routeId,taskIds,pendingTaskIds,evidence,focusTopics:routeTopics(routeId),structureClusterId:p.structureClusterId,
     difficulty:route.requiredSkills.length+(p.problemNumber||0),candidate:{...c,definition:definition(c,r)},
     training:taskIds.map(id=>({...byId.get(id),definition:definition(byId.get(id),r.tasks[id])}))});
   }
  }
  return result;
 }
 function next(originals,training,profile,history,state,group){
  return nextFromPlans(plans(originals,training,profile,history,state),group);
 }
 function nextFromPlans(prepared,group){
  const candidates=prepared.filter(p=>!(group.deferredExamIds||[]).includes(p.examId)&&(!group.retryTarget||p.examId===group.retryTarget.examId&&p.routeId===group.retryTarget.routeId));
  let plan=candidates.find(p=>p.examId===group.target?.examId&&p.routeId===group.target.routeId);
  if(!plan){
   const covered=new Set(group.coveredFocusTopics||[]),selected=new Set(group.profileSnapshot?.topicIds||[]);
   const newFocus=plan=>(plan.focusTopics||routeTopics(plan.routeId)).filter(id=>selected.has(id)&&!covered.has(id)&&id!=='A01'&&id!=='A02').length;
   candidates.sort((a,b)=>(newFocus(b)-newFocus(a))||(a.pendingTaskIds.length-b.pendingTaskIds.length)||
    (Number(a.structureClusterId===group.lastStructure)-Number(b.structureClusterId===group.lastStructure))||a.difficulty-b.difficulty||a.examId.localeCompare(b.examId));
   plan=candidates[0];
  }
  if(!plan)return {candidate:null,reasonCodes:['NO_REVIEWED_CONNECTED_SUPPLY']};
  const target={examId:plan.examId,routeId:plan.routeId,taskIds:plan.taskIds};
  if(plan.pendingTaskIds.length){
   const candidate=plan.training.find(t=>t.id===plan.pendingTaskIds[0]);
   return {candidate,mode:'training',stage:candidate.definition.role,target,readiness:null};
  }
  return {candidate:plan.candidate,mode:'practice',stage:'application',target,
   readiness:{kind:'prepared_application',routeId:plan.routeId,evidence:copy(plan.evidence),independentHoldout:false}};
 }
 function targetSnapshot(target){
  const p=M.getProblem(target?.examId),checked=review(p);if(!checked.eligible||!p.routeIds.includes(target.routeId)||!Array.isArray(target.taskIds))return null;
  return M.canonical({problem:problemSnapshot(p),review:checked.record,route:M.data.routes[target.routeId],tasks:target.taskIds.map(id=>M.data.tasks[id]&&taskSnapshot(M.data.tasks[id]))});
 }
 function defer(group,attempt,reason){
  const target=group.target,snapshot=targetSnapshot(target);if(!snapshot)return group;
  const descriptor={deferredId:group.groupId+':'+attempt.attemptId,sourceGroupId:group.groupId,sourceAttemptId:attempt.attemptId,
   failedTaskId:attempt.id,mappingBuildId:group.mappingBuildId,target:copy(target),targetSnapshot:snapshot,reason,createdAt:Date.now()};
  group.deferredTargets??=[];
  if(!group.deferredTargets.some(d=>d.deferredId===descriptor.deferredId))group.deferredTargets.push(descriptor);
  group.deferredExamIds=[...new Set([...(group.deferredExamIds||[]),target.examId])];group.target=null;return group;
 }
 function deferredPlan(descriptor,originals,training,profile,history,state){
  const groups=[...(state?.sessions.connectedArchive||[]),state?.sessions.connected].filter(Boolean),source=groups.find(g=>g.groupId===descriptor?.sourceGroupId);
  const recorded=source?.deferredTargets?.find(d=>d.deferredId===descriptor?.deferredId),attempt=[...(state?.sessions.archived||[]),state?.sessions.active].find(a=>a?.attemptId===descriptor?.sourceAttemptId);
  if(!recorded||M.canonical(recorded)!==M.canonical(descriptor)||!attempt||attempt.connectedGroupId!==source.groupId||!source.attemptIds.includes(attempt.attemptId)||descriptor.failedTaskId!==attempt.id||!['LEARNER_DEFERRED','GROUP_LIMIT'].includes(descriptor.reason))return {plan:null,reason:'DEFERRED_RECORD_INVALID'};
  const finished=S.attempt(state,attempt.attemptId).events.find(e=>e.type==='attempt_finished');
  if(!finished||descriptor.reason==='LEARNER_DEFERRED'&&finished.reason!=='skipped'||descriptor.reason==='GROUP_LIMIT'&&source.attemptIds.length!==source.total)return {plan:null,reason:'DEFERRED_RECORD_INVALID'};
  if(descriptor.mappingBuildId!==M.data.mappingBuildId||descriptor.targetSnapshot!==targetSnapshot(descriptor.target))return {plan:null,reason:'DEFERRED_CONTENT_CHANGED'};
  const plan=plans(originals,training,profile,history,state).find(p=>p.examId===descriptor.target.examId&&p.routeId===descriptor.target.routeId&&M.canonical(p.taskIds)===M.canonical(descriptor.target.taskIds));
  return plan?{plan,reason:null}:{plan:null,reason:'DEFERRED_TARGET_OUTSIDE_CURRENT_SCOPE_OR_SUPPLY'};
 }
 function freshGroup(profile,seed=1){return {schemaVersion:1,groupId:'connected-'+Date.now()+'-'+Math.random().toString(36).slice(2,10),mappingBuildId:M.data.mappingBuildId,profileSnapshot:copy(profile),total:10,attemptIds:[],deferredExamIds:[],deferredTargets:[],target:null,lastStructure:null,status:'active',seed,startedAt:Date.now()}}
 function coverage(){return R.coverage()}
 return {problemSnapshot,taskSnapshot,definition,taskEvidenceKey,review,success,plans,focusPlans,routeTopics,next,nextFromPlans,targetSnapshot,defer,deferredPlan,freshGroup,coverage};
})(typeof module!=='undefined'?require('./exam_mapping'):ExamMapping,typeof module!=='undefined'?require('./transfer_policy'):TransferPolicy,typeof module!=='undefined'?require('./transfer_evidence_store'):TransferEvidenceStore,typeof module!=='undefined'?require('./child_form_reviews.json'):window.__AMC8_CHILD_FORMS);
if(typeof module!=='undefined')module.exports=ConnectedLearning;


;
'use strict';
const ExamDiagnostics=((M,R,registry)=>{
 const copy=x=>JSON.parse(JSON.stringify(x));
 function presentation(d){return Object.fromEntries(['taskId','prompt','givenText','givenFigures','givenTable','answerContract','options','hints','auxiliaryFigure','grantsJudgmentEvidence'].map(k=>[k,d[k]??(['givenFigures','givenTable','options'].includes(k)?[]:k==='givenText'?'':null)]))}
 function snapshot(parentId,probeTaskId,judgmentId){
  const parentTask=M.data.tasks[parentId],p=M.getProblem(parentTask?.originProblemGroupId||parentId),probe=M.data.tasks[probeTaskId];
  if(!p||!probe||probe.originProblemGroupId!==p.examId||!p.judgmentIds.includes(judgmentId))return null;
  const checked=R.review(p);if(!checked.eligible)return null;const r=checked.record;
  const parentDefinition=parentTask?R.definition({definition:parentTask},r.tasks[parentId]):{taskId:p.examId,...p.presentation,...r,answerContract:p.answerContract,grantsJudgmentEvidence:false,auxiliaryFigure:null};
  return {problem:R.problemSnapshot(p),reviewedProblem:r,parentTask:parentTask?R.taskSnapshot(parentTask):null,
   probeTask:R.taskSnapshot(probe),judgment:Object.fromEntries(['judgmentId','examId','judgmentTypeId','diagnosticProbeTaskId','evidenceScope','decision','reviewIdentity'].map(k=>[k,M.data.judgments[judgmentId][k]])),
   parentPresentation:presentation(parentDefinition),probePresentation:presentation(R.definition({definition:probe},r.tasks[probeTaskId]))};
 }
 function review(link){
  if(link?.status!=='REVIEWED'||link.scope!=='SUPPORT_ONLY_RETURN_TO_PARENT'||link.parentId===link.probeTaskId)return {eligible:false,reason:'REMEDIATION_REVIEW_PENDING'};
  const current=snapshot(link.parentId,link.probeTaskId,link.judgmentId);
  return current&&M.canonical(current)===M.canonical(link.snapshot)?{eligible:true,link}:{eligible:false,reason:'REMEDIATION_REVIEW_STALE'};
 }
 function choose(parent,tasks,allowedRouteIds,history){
  for(const link of registry.links||[]){
   if(link.parentId!==parent.id||!review(link).eligible||!allowedRouteIds.includes(link.routeId))continue;
   const probe=tasks.find(t=>t.id===link.probeTaskId);if(!probe||history.exposedMathKeys.includes(probe.mathKey)||history.solvedMathKeys.includes(probe.mathKey))continue;
   if(M.canonical(presentation(parent.definition))!==M.canonical(link.snapshot.parentPresentation)||M.canonical(presentation(probe.definition))!==M.canonical(link.snapshot.probePresentation))continue;
   return {link:copy(link),candidate:{...copy(probe),definition:{...copy(probe.definition),grantsJudgmentEvidence:false}}};
  }
  return null;
 }
 function propose(attempt){
  const evidence=attempt?.judgmentEvidence||[];
  if(!evidence.length)return {certainty:'insufficient',hypotheses:[],probes:[],message:'目前只有终答，先观察一道简短的新任务再判断原因。'};
  const failed=evidence.filter(e=>e.outcome==='INCORRECT'),unknown=evidence.filter(e=>e.outcome==='UNRECOGNIZED');
  return {certainty:failed.length?'observed':'insufficient',hypotheses:failed.map(e=>({judgmentId:e.judgmentId,claim:'本次局部判断尚未通过',scope:'this_instance_only'})),probes:[...new Set(failed.map(e=>e.probeTaskId).filter(Boolean))],unknownCount:unknown.length,changesDeclaredKnowledge:false};
 }
 return {propose,presentation,snapshot,review,choose};
})(typeof module!=='undefined'?require('./exam_mapping'):ExamMapping,typeof module!=='undefined'?require('./child_review_status'):ChildReviewStatus,typeof module!=='undefined'?require('./remediation_reviews.json'):window.__AMC8_REMEDIATION_REVIEWS);
if(typeof module!=='undefined')module.exports=ExamDiagnostics;


;

;
'use strict';
// Read-only projection. No entry point rewrites old attempts or awards mastery.
const JointReuseReview=(()=>{
 const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>M.canonical(a)===M.canonical(b);
 const M=typeof module!=='undefined'?require('./exam_mapping'):ExamMapping,R=typeof module!=='undefined'?require('./child_review_status'):ChildReviewStatus;
 function create(config){
  const {mapping,joint,baseline,registry,tasks,contracts,sourceHashes}=config,reviewer=R.create(mapping,config.childReviews,config.reviewOptions||{}),byId=new Map(joint.families.map(f=>[f.id,f]));
  function snapshot(familyId,targets=[]){
   const f=byId.get(familyId),b=baseline.families.find(f=>f.familyId===familyId);if(!f||!b||!same(b.instanceIds,f.instances.map(t=>t.id))||f.primarySkillId!==b.primarySkillId||config.nativeCacheCurrent===false||config.capturedFamilies&&!same(config.capturedFamilies[familyId],f))return null;
   if(b.instanceIds.some(id=>!tasks[id]||!contracts[id]))return null;
   const targetRows=[];
   for(const target of targets){
    const t=mapping.tasks[target.taskId],p=t&&mapping.problems[t.originProblemGroupId],checked=reviewer.review(p),j=mapping.judgments[target.judgmentId];
    const binding=Object.values(mapping.bindings).find(b=>b.judgmentId===target.judgmentId&&b.taskRef.taskId===target.taskId&&b.taskRef.contentRevision===t?.contentRevision&&['PARTIAL_DECISION','FULL_STRUCTURE'].includes(b.matchLevel)&&!b.policyGaps?.length);
    if(!checked.eligible||!j||j.examId!==p.examId||!mapping.routes[target.routeId]?.judgmentIds.includes(j.judgmentId)||!binding)return null;
    targetRows.push({target,problem:reviewer.problemSnapshot(p),review:checked.record,task:reviewer.taskSnapshot(t),judgmentIdentity:j.reviewIdentity});
   }
   return copy({family:f,tasks:Object.fromEntries(b.instanceIds.map(id=>[id,tasks[id]])),contracts:Object.fromEntries(b.instanceIds.map(id=>[id,contracts[id]])),sourceHashes,targets:targetRows});
  }
  function review(familyId){
   const row=registry.families[familyId];if(!row||row.status!=='REVIEWED')return {eligible:false,status:'REVIEW_REQUIRED',matchLevel:'NO_MATCH',reason:'尚未记录逐实例的语义审核'};
   const ids=baseline.families.find(f=>f.familyId===familyId)?.instanceIds;
   if(!['FOUNDATION_ONLY','PARTIAL_DECISION'].includes(row.matchLevel)||!Array.isArray(row.targets)||row.matchLevel==='FOUNDATION_ONLY'&&row.targets.length||row.matchLevel==='PARTIAL_DECISION'&&!row.targets.length||!ids||!same(Object.keys(row.instanceReviews||{}).sort(),ids.slice().sort())||ids.some(id=>typeof row.instanceReviews[id]!=='string'||!row.instanceReviews[id])||!row.reviewNote)return {eligible:false,status:'STALE',matchLevel:'NO_MATCH',reason:'审核结论或适用范围不合法'};
   const current=snapshot(familyId,row.targets);
   if(!current||!same(current,row.snapshot))return {eligible:false,status:'STALE',matchLevel:'NO_MATCH',reason:'原题族、实际任务、判分来源或对应真题变化，需复审'};
   if(row.targets.some(t=>t.scope!=='LEGACY_LOCAL_PREPARATION_ONLY'||!t.instanceIds.length||t.instanceIds.some(id=>!current.tasks[id])))return {eligible:false,status:'STALE',matchLevel:'NO_MATCH',reason:'复用范围未锁定到已审实例'};
   return {eligible:row.matchLevel==='PARTIAL_DECISION',status:'REVIEWED',matchLevel:row.matchLevel,reason:row.reviewNote,record:row};
  }
  function projection(){return baseline.families.map(b=>{const r=review(b.familyId);return {...b,candidateExamRouteIds:Object.values(mapping.routes).filter(r=>r.requiredKnowledge.includes(b.primarySkillId)).map(r=>r.routeId),status:r.status,matchLevel:r.matchLevel,reason:r.reason,targets:r.record?.targets||[],instanceReviews:r.record?.instanceReviews||{}}})}
  function matches(record,t,contract){
   const f=record?.jointFacts,s=t.joint,eq=(a,b)=>Array.isArray(a)&&same(a,b);
   return record?.pendingSave!==true&&!!f&&record.evidenceVersion===2&&record.evidenceRuleVersion===contract.evidenceRuleVersion&&record.evidenceScope===contract.evidenceScope&&record.assessmentType===contract.assessmentType&&record.formalEligible===contract.formalEligible&&record.contentVersion===t.contentVersion&&record.gradingResult==='correct'&&Number.isFinite(record.submittedAt)&&record.submittedAt>0&&typeof record.id==='string'&&typeof record.modelViewed==='boolean'&&Array.isArray(record.hintEvents)&&typeof record.firstSubmissionCorrect==='boolean'&&f.familyId===s.familyId&&f.kind===s.kind&&eq(f.targetNodeIds,s.targetNodeIds)&&eq(record.skillIds,s.targetNodeIds)&&eq(f.supportNodeIds,s.supportNodeIds)&&eq(f.relationIds,s.relationIds)&&f.nativeAnchorPassed===true&&f.supportAnchorPassed===true&&f.signature===contract.signature;
  }
  function readLegacy(records){
   const grants=[],seen=new Set();
   const byId=new Map(),conflicts=new Set();
   for(const record of records||[]){if(!record||typeof record.id!=='string')continue;if(byId.has(record.id)&&!same(byId.get(record.id),record))conflicts.add(record.id);else byId.set(record.id,record)}
   for(const record of byId.values()){
    if(conflicts.has(record.id))continue;
    const t=tasks[record?.taskInstanceId];if(!t)continue;const checked=review(t.joint.familyId);if(!checked.eligible||!matches(record,t,contracts[t.id]))continue;
    for(const target of checked.record.targets){
     if(!target.instanceIds.includes(t.id))continue;const key=record.id+':'+target.taskId;if(seen.has(key))continue;seen.add(key);
     grants.push({familyId:t.joint.familyId,taskInstanceId:t.id,sourceRecordId:record.id,sourceSubmittedAt:record.submittedAt,sourceUsedHelp:record.modelViewed===true||!!record.hintEvents?.length,sourceFirstResponseCorrect:record.firstSubmissionCorrect===true,targetTaskId:target.taskId,judgmentId:target.judgmentId,routeId:target.routeId,matchLevel:'PARTIAL_DECISION',evidenceScope:'legacy_local_preparation_only',readOnly:true,independent:false,holdout:false,grantsMastery:false});
    }
   }
   return grants;
  }
  return {snapshot,review,projection,readLegacy,matches};
 }
 let config;
 if(typeof module!=='undefined'){
  const fs=require('fs'),path=require('path'),cp=require('child_process'),native=require('./joint_native_snapshot.json'),joint=require('./joint_families.json');
  const hashes=JSON.parse(cp.execFileSync('python3',[path.join(__dirname,'native_reuse_inputs.py')],{encoding:'utf8'}));
  const {captureIdentity,...payload}=native;if(Object.keys(native.tasks).length&&require('crypto').createHash('sha256').update(M.canonical(payload)).digest('hex')!==captureIdentity)throw Error('Native capture identity changed; rebuild the bundle and run capture_joint_reuse.js');
  config={mapping:M.data,joint,baseline:require('./joint_reuse_baseline_95.json'),registry:require('./joint_reuse_reviews.json'),childReviews:require('./child_form_reviews.json'),tasks:native.tasks,contracts:native.contracts,sourceHashes:hashes,nativeCacheCurrent:same(hashes,native.sourceHashes),capturedFamilies:native.families,reviewOptions:{checkFiles:true}};
 }else config={mapping:M.data,joint:JOINT_CONTENT,baseline:window.__AMC8_REUSE_BASELINE,registry:window.__AMC8_REUSE_REVIEWS,childReviews:window.__AMC8_CHILD_FORMS,tasks:copy(JOINT_TASKS),contracts:Object.fromEntries(Object.values(JOINT_TASKS).map(t=>[t.id,{...assessmentEvidenceContext(t,{view:'joint'}),evidenceRuleVersion:ASSESSMENT_RULES.version,signature:jointMathSignature(t)}])),sourceHashes:window.__AMC8_REUSE_SOURCE_HASHES};
 return {...create(config),create,config};
})();
if(typeof module!=='undefined')module.exports=JointReuseReview;

'use strict';
// Every value in the public prompt is a given. Derived quantities stay in the
// private answer/route contract until the learner verifies a relation or asks.
const CompetitionIntegrated=(()=>{
 const config={integratedWeightedPlan:['mean-admission','score-training'],integratedRatioPlan:['length-border','perimeter-fence']};
 const skillSets={
  'mean-admission':['R01.01','D02.02','A02.01','A02.04','A02.05','C02.03','N01.02','A01.04'],
  'score-training':['R01.01','D02.02','A02.01','A02.04','A02.05','C02.03','A01.04','N01.02'],
  'length-border':['R01.01','R01.05','G01.02','G01.03','A02.01','A02.04','A02.05','A03.02','A03.04','N01.02'],
  'perimeter-fence':['R01.01','R01.05','G01.02','A02.01','A02.04','A02.05','C02.03','N01.02','A01.04']
 };
 const catalog=Object.entries(config).map(([id,configurations])=>({id,integrated:true,configurations,title:id==='integratedWeightedPlan'?'积分与活动规划':'尺寸与采购规划',topicIds:id==='integratedWeightedPlan'?['R01','D02','A02','C02','N01']:['R01','G01','A02','A03','C02','N01'],level:3,reasoningKey:id,strategy:id,origin:'rc70-integrated',selectionLoads:{calculationLoad:{level:2,operations:8,enumeration:12,fractional:false,digits:4},readingLoad:{level:3}}}));
 const ceilDiv=(n,d)=>Math.floor((n+d-1)/d);
 function purchase(need,pack=5,bundle=70,single=15){const rows=[];for(let b=0;b<=Math.ceil(need/pack);b++){const s=Math.max(0,need-b*pack);rows.push({b,s,cost:b*bundle+s*single,bought:b*pack+s})}return rows.sort((a,b)=>a.cost-b.cost||a.bought-b.bought)[0]}
 function data(kind,seed){
  const n=(seed-1)%5,N=30+5*n,offset=2*n,red=N*2/5,blue=N*3/5,low=60+offset,high=80+offset,total=red*low+blue*high;
  if(kind==='mean-admission'){
   const target=75+offset,score=90+offset,limit=N+10,rows=[];for(let x=0;x<=limit;x++)if(total+score*x>=target*(N+x))rows.push({x,packs:ceilDiv((N+x)*4,8),cost:ceilDiv((N+x)*4,8)*18});const best=rows[0];
   return {math:{N,red,blue,low,high,total,target,score,cap:best.x+4},prompt:`红蓝两队共${N}人，人数比2:3，每人平均得分分别为${low}、${high}。最多增加${best.x+4}名平均得分${score}的新成员，使全体平均分至少${target}。活动给每人4份材料，每包8份、18元，只能整包买。最少材料费多少元？`,answer:best.cost,variation:{prompt:`其余条件不变，但最多只能增加${best.x-1}人。若仍能达到平均分目标，填最少材料费；无法达到则填0。`,answer:0,key:'cap-feasibility-v1',parameters:{cap:best.x-1}},nodes:[['counts','红蓝两队分别有多少人？先填写红队人数。',red,'人',[],`${N}*2/(2+3)`],['total','按实际人数合计原来的总分。',total,'分',['counts'],`${red}*${low}+${blue}*${high}`],['admission','列出允许的新人数，最少加几人才能达到目标？',best.x,'人',['total'],'bounded-admission-table'],['materials','应为新整体准备多少份材料？',(N+best.x)*4,'份',['admission'],`(${N}+${best.x})*4`],['packages','满足材料量至少需多少整包？',best.packs,'包',['materials'],'whole-pack-ceiling'],['target','计算费用，并检查增加人数会不会降低采购需求。',best.cost,'元',['packages'],'minimum-feasible-purchase']]};
  }
  if(kind==='score-training'){
   const mean=72+offset,target=75+offset,deficit=target*N-total,rows=[];for(let g=0;g<=2;g++)for(let y=0;y<=red-3*g;y++)if(g*30+y*20>=deficit)rows.push({g,y,cost:g*16+y*12,people:g*3+y});const best=[...rows].sort((a,b)=>a.cost-b.cost)[0],budget=Math.max(60,best.cost+12),v=Math.min(...rows.filter(x=>x.cost<=budget).map(x=>x.people));
   return {math:{N,red,blue,low,high,total,mean,target,deficit},prompt:`红蓝两队共${N}人，人数比2:3，蓝队均分${high}，全体均分${mean}；红队每人原成绩相同。只培训红队，要求全体均分至少${target}。个人班每人12元，使该人成绩达到${80+offset}；三人班每组16元，使每人成绩达到${70+offset}，最多2组。每人只能参加一种。最少费用多少元？`,answer:best.cost,variation:{prompt:`培训规则不变，改问：总预算${budget}元以内，至少培训多少名红队成员能达成目标？`,answer:v,key:'min-people-with-budget-v1',parameters:{budget}},nodes:[['red-count','先确定红队人数。',red,'人',[],`${N}*2/5`],['red-score','从全体和蓝队总分反求红队每人的原成绩。',low,'分',['red-count'],`(${N}*${mean}-${blue}*${high})/${red}`],['deficit','全体至少还需要增加多少总分？',deficit,'分',['red-score'],`${N}*${target}-${total}`],['personal-gain','个人班每人增加多少分？',20,'分',['red-score'],`${80+offset}-${low}`],['group-gain','三人班每组增加多少总分？',30,'分',['red-score'],`3*(${70+offset}-${low})`],['target','枚举0、1、2个三人班，并检查人数限制，选最低费用。',best.cost,'元',['deficit','personal-gain','group-gain'],'bounded-training-optimization']]};
  }
  if(kind==='length-border'){
   const L=12+3*n,W=8+2*n,border=1+n%2,area=L*W-(L-2*border)*(W-2*border),tiles=area*4,packs=ceilDiv(tiles,10),price=25+n,budget=packs*price;let maxBorder=0;for(let b=1;2*b<W;b++)if(ceilDiv((L*W-(L-2*b)*(W-2*b))*4,10)*price<=budget)maxBorder=b;
   return {math:{L,W,perimeter:2*(L+W),border,area,tiles,packs,price},prompt:`长方形长宽比3:2，周长${2*(L+W)}米。沿内部四边铺${border}米宽边框，每块砖覆盖0.25平方米，每包10块、${price}元，只能整包买，忽略切割损耗。最少费用多少元？`,answer:budget,variation:{prompt:`长方形、砖和价格不变，总预算${budget}元。边框宽度必须为正整数米，且中央留下的长宽均大于0；边框最宽多少米？`,answer:maxBorder,key:'budget-to-width-v1',parameters:{budget}},nodes:[['side-sum','先求一条长与一条宽的和。',L+W,'米',[],`${2*(L+W)}/2`],['width','利用同一份比例，求宽。',W,'米',['side-sum'],`${L+W}/5*2`],['area','外面积减内部未铺部分，边框面积是多少？',area,'平方米',['width'],`${L}*${W}-(${L}-2*${border})*(${W}-2*${border})`],['tiles','单位面积换算后需要多少块砖？',tiles,'块',['area'],`${area}/0.25`],['packages','完整包装限制下至少买几包？',packs,'包',['tiles'],'whole-pack-ceiling'],['target','给出最少费用，核对单位与角部是否重算。',budget,'元',['packages'],`${packs}*${price}`]]};
  }
  const W=8+2*n,L=12+3*n,gate=3+n%2,perimeter=2*(L+W),panels=Math.ceil((perimeter-gate)/2),best=purchase(panels),additional=Math.max(0,Math.ceil(perimeter/2)-best.bought),extra=purchase(additional).cost;
  return {math:{L,W,gate,perimeter,panels,best},prompt:`长方形长宽比3:2，宽${W}米，外围留${gate}米门洞。围栏板每块2米，可裁剪，余料可跨边拼用。单块15元，5块装70元。另需4个角柱，每个6元。最少总费用多少元？`,answer:best.cost+24,variation:{prompt:`原方案已有${best.bought}块板材，均可继续使用，角柱已备好。现在把门洞也封上，最少还要花多少元？`,answer:extra,key:'reuse-stock-close-gate-v1',parameters:{stock:best.bought}},nodes:[['length','根据长宽比确定长。',L,'米',[],`${W}/2*3`],['perimeter','先求完整的一周长度。',perimeter,'米',['length'],`2*(${L}+${W})`],['fence','门洞之外实际需围多长？',perimeter-gate,'米',['perimeter'],`${perimeter}-${gate}`],['panels','余料可拼用，但板材必须整块买，至少几块？',panels,'块',['fence'],'whole-panel-ceiling'],['purchase','比较整包与单块组合，最低板材费多少？',best.cost,'元',['panels'],'bounded-bundle-table'],['target','加入必要角柱，给出最低总费用。',best.cost+24,'元',['purchase'],`${best.cost}+4*6`]]};
 }
 function create(recipe){
  const f=catalog.find(x=>x.id===recipe.familyId),kind=recipe.configurationId||f?.configurations[0],seed=recipe.seed;
  if(!f||!f.configurations.includes(kind)||recipe.generatorRevision!==5||!Number.isInteger(seed)||seed<1||seed>2147483647)throw Error('INVALID_INTEGRATED_RECIPE');
  const d=data(kind,seed),answer=String(d.answer),signature=JSON.stringify({family:f.id,configuration:kind,math:d.math}),id='COMP-I-'+f.id+'-'+kind+'-'+seed;
  const nodes=d.nodes.map(([nodeId,prompt,value,unit,deps,rule])=>({id:nodeId,prompt,answer:String(value),unit,prerequisiteIds:deps,inputIds:deps,outputId:nodeId,requiredSkillIds:skillSets[kind],rule:{kind:'family-quantity-relation',statement:prompt},relationRuleId:rule,acceptedExpressions:[String(value)],hints:[prompt+'先回到题给条件选择所需的量。','核对这个关系的整体、单位和允许范围。'],errorCheck:'核对所用的量、条件与整数限制。',disclosure:'current-node-only'}));
  const routes=[{id:'integrated-plan',name:'建立关系并比较合法方案',requiredSkills:skillSets[kind],nodes}],goal={id:kind+'-cost',quantityId:'target',unit:'元',questionText:d.prompt},answerContract={kind:'exact-rational',value:answer,unit:'元'};
  const diagram=f.id==='integratedWeightedPlan'?{kind:'scene-units',groups:[{name:'红队',count:2,unit:'人数份',score:kind==='mean-admission'?d.math.low:'?'},{name:'蓝队',count:3,unit:'人数份',score:d.math.high}],object:'person',average:kind==='score-training'?d.math.mean:'?',caption:'比例代表2份与3份，不是实际人数；总人数'+d.math.N+'，各队实际人数由你求。'}:{kind:'scene-ratioBorder',width:kind==='perimeter-fence'?d.math.W:'?',perimeter:kind==='length-border'?d.math.perimeter:'?',border:kind==='length-border'?d.math.border:null,gate:kind==='perimeter-fence'?d.math.gate:null,caption:'只表示题给比例、边框或门洞；未填写求解结果，尺寸以题给为准。'};
  const extension={...d.variation,answer:String(d.variation.answer),signature:JSON.stringify({main:signature,variation:d.variation.key}),solution:'按变式的新目标重新检查整体、可行条件与最优性。',diagram:kind==='length-border'?{...diagram,border:'?'}:kind==='perimeter-fence'?{...diagram,gate:0}:JSON.parse(JSON.stringify(diagram)),solutionFrames:[],problemState:{schemaVersion:1,familyId:f.id,math:{...d.math,...d.variation.parameters},goal:{id:d.variation.key,quantityId:'variation-target',unit:''},answerContract:{kind:'exact-rational',value:String(d.variation.answer),unit:''},adapterStatus:'explicit'}};
  const variantState=extension.problemState,variantUnit=kind==='score-training'?'人':kind==='length-border'?'米':'元';
  Object.assign(variantState,{id:id+':variation',expectedAnswer:extension.answer,normalizedModel:'integrated-'+kind,relations:['使用变式给定的新限制与目标，重新核对合法方案及最优性'],quantityIds:Object.keys(variantState.math).map(key=>({id:id+':variation:'+key,key})),quantityDomain:'nonnegative-rational'});
  variantState.goal.unit=variantUnit;variantState.answerContract.unit=variantUnit;extension.answerContract=variantState.answerContract;
  Object.assign(extension.diagram,{mathStateId:variantState.id,targetQuantityId:variantState.goal.id,statePhase:'variation-givens'});variantState.projection={diagram:extension.diagram,diagramPhase:'variation-givens'};
  const options=[answer,...[1,2,3,4].map(n=>String(d.answer+n))];
  return {id,contentVersion:112,mode:'competition',skillId:f.topicIds[0]+'.01',phase:'综合挑战',prompt:d.prompt,options,optionIds:options.map(v=>id+':'+v),answer:0,competition:{family:f.id,title:f.title,integrated:true,configurationId:kind,math:d.math,prompt:d.prompt,answer,answerContract,signature,topicIds:f.topicIds,recipe:{...recipe,configurationId:kind},level:3,reasoningKey:f.reasoningKey,hints:['先选择已学工具，把题给条件与最终目标连接起来；不急着计算所有数字。','比较可行性、整体和整包限制，保留合法方案后再判断最少。'],methods:[{name:'建立关系并验证最优性',steps:d.nodes.map(x=>x[1]+' '+x[2]+x[3])}],extension,diagram,problemState:{schemaVersion:1,familyId:f.id,math:d.math,goal,answerContract},routes,authoredGraph:{schemaVersion:1,graphRevision:4,familyId:f.id,configurationId:kind,goal,coverageStatus:'authored',routes},calculationLoad:{level:2,operations:8,enumeration:12,fractional:false,digits:4},readingLoad:{level:3},quality:{modelId:kind.includes('border')||kind.includes('fence')?'boundary-and-area':'total-and-position',variationSpec:{change:extension.key,transferStrength:'changed-goal-or-constraint'}}}};
 }
 return {catalog,config,skillSets,data,create,purchase};
})();
if(typeof module!=='undefined')module.exports=CompetitionIntegrated;

'use strict';
// Engine 3 is an editorial layer. Engine 1/2 stay unchanged for record replay.
const {COMPETITION_REVIEWED,competitionReviewedEligible,competitionReviewedCreate,competitionReviewedRecipe}=((base,extra,helpers,fresh,rules,design,structured,sources)=>{
 const {competitionCanonicalIds,competitionHash,competitionFraction:F,competitionRatioText}=helpers;
 const revision=93;
 const diagnosticFamilies=new Set(['digitInsert','telescopingDifferences']);
 const descriptions={1:'关系较直接，辨认一个关键条件后即可求解',2:'需要衔接两步推理，或在两种表示之间转换',3:'需要处理多重约束、隐含结构，或证明极值与不变量'};
 // Each row records a content decision, not a claim of learning effectiveness.
 const rows=[
 ['reverseDigits',2,'交换数字','交换前后的位值差与数字和共同确定两个数字'],
 ['fractionBackwards',2,'两天的贴纸','两次分数的整体不同，可逆推或统一原量'],
 ['percentRoundTrip',2,'价格变化','两次百分比的基准不同，变化量不能直接抵消'],
 ['squareBorder',2,'积木边框','求新增部分可用面积差或不重叠的边界计数'],
 ['ratioEqualize',2,'两色球','增加量对应比例中的差额而非总份数'],
 ['packPrice',2,'买笔','便宜单位价仍受整包与恰好数量约束'],
 ['equalDistanceSpeed',2,'往返行程','相等路程对应不等时间，平均速度的权重是时间'],
 ['oppositeScale',2,'图形尺寸','面积不变要求两个方向的长度倍率互为倒数'],
 ['balanceCancel',1,'天平上的盒子','相同部分可从平衡的两边同时移去'],
 ['tickets',2,'买票的人数','人数与总价共同约束两类数量'],
 ['recurrenceBackwards',2,'数列的起点','给定相邻末项后，递推可通过相减反向还原'],
 ['linearTable',1,'机器表格','输入差与输出差确定固定变化率'],
 ['divisibleDigits',3,'数字空格','同时满足两种整除限制并比较位值取得最大数'],
 ['factorBalance',2,'一对整数','合法因数对中比较和，需覆盖全部候选'],
 ['bells',2,'两只铃','共同周期的计数必须同时处理起止端点'],
 ['lastDigit',2,'幂的个位','指数的余数必须对应从一次方开始的循环位置'],
 ['fixedPerimeter',3,'长方形设计','整数约束下证明边长尽量接近会增大面积'],
 ['outsideAngle',2,'三角形的外角','等腰条件与内外角关系可沿两条路线使用'],
 ['overlapSquares',2,'两张正方形纸','移动量决定交集边长，覆盖区域须避免重计'],
 ['circleRoute',1,'圆形跑道','圆周的两条补弧中比较较短的一条'],
 ['similarAreaPerimeter',2,'两个相似图形','面积比先还原为长度比，再用于周长'],
 ['ladderShift',2,'靠墙的梯子','固定斜边对应两组直角边，可计算或识别结构'],
 ['paintedCube',2,'涂色小块','边界位置决定涂色面数，角块须单独分类'],
 ['exactlyOneSet',2,'两个活动组','恰好一组与至少一组对交集有不同处理'],
 ['gridDetour',3,'方格中的路线','通过限制点的前后路径配对，或直接逐点递推'],
 ['adjacentLine',2,'朋友排队','相邻对象可捆绑，也可先选相邻位置'],
 ['restrictedTeam',3,'三人小队','无序选人与禁止同选的约束需要完整分类'],
 ['digitComplement',2,'数字密码','至少出现一次可用补集或首个出现位置计数'],
 ['chartScale',1,'三个小组','已知柱高确定刻度，再转换另一部分的数量'],
 ['missingAverage',2,'删去的数','平均数要与人数结合为总和，也可平衡偏差'],
 ['diceSum',2,'两枚骰子','等可能对象是有序点数对，数字和并不等可能'],
 ['foldHoles',2,'纸上的孔','折痕上的孔与内部孔有不同的对称复制次数'],
 ['checkerDomino',3,'棋盘与骨牌','颜色给出上界后，还需构造达到上界的摆法'],
 ['natural-weighted',2,'两队的得分','人数比例决定平均数的权重'],
 ['natural-fractionWeighted',2,'两队的积分','人数权重决定平均结果，不能直接平均两个队的每人得分'],
 ['natural-catch',2,'两人的行程','领先距离由延迟形成，差速决定追及时间'],
 ['natural-tiles',2,'铺地砖','边长须共同整除两边，求最大规格后数铺排'],
 ['natural-pairChance',2,'袋中的球','不放回的球对可按无序组合或有序取出计数'],
 ['natural-unionChance',2,'抽到的组员','先去重确定有利人数，再与全体比较'],
 ['natural-complementChance',2,'抽到的小朋友','既未参加任何组的人数是并集的补集'],
 ['natural-offers',2,'两家商店','固定配送费和每件折后价作用于不同量'],
 ['natural-angleRatio',1,'三角形的三个角','内角总和对应完整比例份数'],
 ['natural-digitCount',2,'两位数卡','十位个位的有序选择同时受整除限制'],
 ['natural-distinctDigitCount',3,'两位数卡','有序选择、整除和不重复三项约束共同限制'],
 ['natural-coordinateDistance',2,'两个点','直线距离与横纵距离的合计不是同一个量'],
 ['routeProbability',3,'随机路线','完整路线等可能，受限制的路径数决定概率'],
 ['cubeProbability',2,'随机小块','空间边界分类得到有利数，分母为全部小块'],
 ['overlapProbability',2,'随机落点','等可能区域是并集，交集面积不能重复放入分母'],
 ['ratioUnion',3,'参加活动的人','先从不同人数还原参加次数，再用比例反求各组'],
 ['chartAverage',2,'得分图','频数决定权重，可合计总分或平衡基准偏差'],
 ['parityPermutations',3,'数字排列','先确定不相邻的位置，再安排不同数字'],
 ['recurrenceRemainders',3,'数列的余数','相邻余数对构成状态，确认周期后分段求和']
 ];
 const benchmarkMap={
 signedProduct:['AMC8-2000-07'],digitDivisor:['AMC8-2000-11'],overlapAverages:['AMC8-2000-23'],
 ageDifference:['AMC8-2000-01'],lShapeArea:['AMC8-2000-06'],cumulativeChart:['AMC8-2000-04'],
 fixedPerimeter:['AMC8-2000-16'],tickets:['AMC8-2000-20'],stampConstraint:['AMC8-2000-20'],
 missingAverage:['AMC8-2000-23'],outsideAngle:['AMC8-2000-13'],parallelTriangle:['AMC8-2000-25'],
 paintedCube:['AMC8-2000-08','AMC8-2000-22'],cubeProbability:['AMC8-2000-08'],
 lastDigit:['AMC8-2000-14'],recurrenceRemainders:['AMC8-2000-14'],divisibleDigits:['AMC8-2000-09']
 };
 const oneMethod=new Set(['factorBalance','lastDigit','similarAreaPerimeter','natural-tiles','natural-angleRatio','parityPermutations','recurrenceRemainders','pairedSum','percentRestore','divisorPowers','circleRingRatio','cubeSteps','numberAppend','riverTravel','parallelTriangle','cumulativeChart','allThreeColors','fractionSharedRemainder','threeDivisors']);
 const M=(name,...steps)=>({name,steps});
 const X=(prompt,answer,solution)=>({prompt,answer:String(answer),solution,kind:'condition-change',key:'condition-transfer'});
 const fact=n=>n<2?1:n*fact(n-1);
 const choose=(n,k)=>k<0||k>n?0:Array.from({length:k},(_,i)=>i+1).reduce((v,i)=>v*(n-i+1)/i,1);
 const routes=(w,h,blocked)=>{let a=Array.from({length:h+1},()=>Array(w+1).fill(0));for(let y=0;y<=h;y++)for(let x=0;x<=w;x++)a[y][x]=blocked&&x===blocked[0]&&y===blocked[1]?0:x+y===0?1:(x?a[y][x-1]:0)+(y?a[y-1][x]:0);return a[h][w]};
 function transfer(id,m,c){
  switch(id){
   case 'reverseDigits':return X(`现在改为两个数字相差 ${m.a-m.b}，交换前后两个数的和仍与原题相同。满足条件的较小两位数是多少？`,10*m.b+m.a,'数位互换后，两数之和等于数字和的11倍。先还原数字和，再配合数字差；把较小数字放十位。');
   case 'fractionBackwards':return X('第二天改为用掉最初总数的 1/3，其余不变。最后剩多少枚？',F(m.left,2),'新的两次分数都以最初总数为整体，剩下1−1/2−1/3=1/6；不能沿用原题剩原量1/3的结论。');
   case 'percentRoundTrip':return X(`只涨价 ${m.percent}% 后，若想恢复原价，应按涨后价降百分之几？填写百分号前的数。`,F(100*m.percent,100+m.percent),'需减少的是原价的涨幅，但分母改为涨后的价格；可取原价100比较。');
   case 'squareBorder':return X('改成只在左侧与上侧加宽1块的一条边框，两侧在左上角相接。需要增加多少块？',2*m.n+1,'大阵每边只多1；新增两条各长n的边和一个公共外角，计2n+1。');
   case 'ratioEqualize':return X(`改为只取走 ${((m.b-m.a)*m.unit)} 个蓝球，不加红球。此时两种球合计多少个？`,2*m.a*m.unit,'取走的数量仍是原来的数量差；两种都变成原来的红球数，而非原来的蓝球数。');
   case 'packPrice':{let cost=Infinity;for(let k=0;k<=Math.ceil(m.count/3);k++)cost=Math.min(cost,k*m.pack+Math.max(0,m.count-3*k)*m.single);return X('数量条件改为至少买够，允许多买；最少需要多少元？',cost,'比较原来的恰好方案与再多买一整包的方案。单价便宜不能代替对总费用的比较。')}
   case 'equalDistanceSpeed':return X('两段速度不变，改为在两个方向行走同样长的时间，平均速度是多少？',F(3*m.speed,2),'这次权重是相同时间，两个速度可以等权平均；原题是相同路程，不能照搬。');
   case 'oppositeScale':return X('两边都改为原来长的相同倍率，面积是原来的几倍？',F(m.b*m.b,m.a*m.a),'面积随两个长度倍率相乘；原题保持面积不变的条件已取消。');
   case 'balanceCancel':return X('同一副天平，右边拿走一个盒子后，为重新平衡，右边应该加几克砝码？',m.x,'去掉右边一个盒子的重量后，补回等量砝码。重量差变化，而不是两边仍有相同盒子数。');
   case 'tickets':{const total=m.adults*m.adult+(m.people-m.adults)*m.child;return X(`票价不变，但同样总价 ${total} 元不限定总人数，允许一种票完全不买。不同的成人、儿童人数方案有几种？`,(()=>{let n=0;for(let a=0;a*m.adult<=total;a++)if((total-a*m.adult)%m.child===0)n++;return n})(),'解除人数限制后，固定成人票数，检查余款能否恰好买整数张儿童票。原来的唯一人数不能直接沿用。')}
   case 'recurrenceBackwards':return X('把求出的第一项增加1，第二项不变，递推规则不变。原题最后已知的那一项会增加多少？',(()=>{let a=1,b=0;for(let i=2;i<m.n;i++)[a,b]=[b,a+b];return b})(),'增量也满足相同递推，从1、0开始逐项相加；不必把原数列从头重算。');
   case 'linearTable':return X(`把每次规则改为先加原来的固定加数、再乘原来的固定乘数，输入 ${m.target} 的输出是多少？`,m.k*(m.target+m.b),'先由两个已知对应求乘数和加数，再按新顺序计算；两个步骤不可任意交换。');
   case 'divisibleDigits':return X('仍用原题数字空格，但改成被9整除且为偶数，求最大的四位数。',(()=>{let best=0;for(let b=0;b<10;b++)for(let d=0;d<10;d+=2){const n=1000*m.a+100*b+10*m.b+d;if(n%9===0)best=Math.max(best,n)}return best})(),'末位的可选数字改为0、2、4、6、8；再检查数字和。原来的末位0或5限制已不成立。');
   case 'factorBalance':return X('如果改为求这两个正整数的和最大，答案是多少？',m.product+1,'检查因数对的另一个极端：1与原乘积。不能把求最小和的“尽量接近”直接用于最大和。');
   case 'bells':{let t=m.a;while(t%m.b)t+=m.a;return X(`时间改为恰好 ${t} 分钟，而且起点与终点都计入。两铃同时响几次？`,2,'区间是闭区间，0与一个完整共同周期这两个端点都应计入。')}
   case 'lastDigit':return X(`把两个连续幂 ${m.base} 的 ${m.exponent} 次方与 ${m.exponent+1} 次方相加，和的个位是多少？`,(Number(c.answer)+Number(BigInt(m.base)**BigInt(m.exponent+1)%10n))%10,'分别定位两个相邻幂的末位，再把末位相加取个位；循环位置不直接成为和的末位。');
   case 'fixedPerimeter':return X('周长不变，改为要求两边都是正偶数。若没有这样的长方形，填写0；否则填最大面积。',(()=>{let a=0;for(let w=2;w<m.half;w+=2)if((m.half-w)%2===0)a=Math.max(a,w*(m.half-w));return a})(),'先检查长宽和能否由两个偶数组成；若可行，在偶数的合法候选中找最接近的一对。');
   case 'outsideAngle':return X('若给定的同一个外角不变，但改问另一个底角，是多少度？',90-m.apex/2,'外角与相邻底角互补；等腰使另一个底角相同。目标改变后不能仍填写原外角。');
   case 'overlapSquares':return X('改为只给恰好被一张纸覆盖的部分上色，面积是多少？',2*m.n*m.n-2*(m.n-m.dx)*(m.n-m.dy),'两张面积相加后，重叠中的每一点出现两次；现在两次都要扣除。');
   case 'circleRoute':return X('若要从A到B再回A，并且必须经过跑道的每一段至少一次，最短总路程是多少米？',m.sectors*m.unit,'走完整圆周可满足要求；每段至少走一次意味着总长不能少于圆周长，两条补弧分别用于去和回。');
   case 'similarAreaPerimeter':return X(`再做一个周长为较小图形 ${m.b} 倍的相似图形，它的面积是较小图形的几倍？`,m.b*m.b,'周长给出长度倍率，面积要用倍率的平方；这次不是从面积比开平方。');
   case 'ladderShift':return X(`仍用这根梯子，让梯顶离地 ${4*m.k} 米，底端离墙多少米？`,3*m.k,'改为以高度作为已知直角边，用固定梯长求另一直角边，或识别原来的3-4-5对应。');
   case 'paintedCube':return X('改为只涂大正方体顶面和底面，再按原样切开。恰好一个面涂色的小块有多少个？',2*m.n*m.n,'顶底面互不相邻，没有小块同时接触这两个面；因此两个完整表层都符合，不能仍只数棱。');
   case 'exactlyOneSet':return X('有一个原来只在棋类组的人又加入球类组，总人数不变。此后恰好参加一组的人数是多少？',Number(c.answer)-1,'棋类不变，球类与交集各增1；只有这一个人由恰好一组变为两组。');
   case 'gridDetour':return X('取消避开P的限制，改为要求路线的第一步向上。这样的最短路线有多少条？',routes(m.w,m.h-1),'第一步已固定，之后剩下同一个宽度、少一段向上的自由路径；无需扣原来的P。');
   case 'adjacentLine':return X('改为小乐与小明不能相邻，共有多少种排列？',fact(m.n)-2*fact(m.n-1),'用所有排列减相邻排列；内部两种顺序仍要包括在被扣除的部分中。');
   case 'restrictedTeam':return X('仍不分职位，但改为必须同时选中小乐和小明，第三人有几种选择？',m.n-2,'两人已固定，只从剩余人中选第三人。原题的禁止条件变成必须条件。');
   case 'digitComplement':return X(`改为恰好一位是 ${m.digit}，密码有多少个？`,m.length*9**(m.length-1),'先选唯一一次出现的位置，其他每位都不能再用它；不是原题的“至少一次”。');
   case 'chartScale':return X('三组柱高各增加一格，但刻度不变。合计人数增加多少？',3*m.unit,'每格所代表的人数由原图确定；三个柱各加一格，合计增加三格。');
   case 'missingAverage':return X('删去的数已取出；现在把它再放回去两次。新平均数是多少？',F(m.count*m.mean+Number(c.answer),m.count+1),'原来全部数放回后，再多一个被删去的数；总和与人数都要增加，不能只给平均数加2。');
   case 'diceSum':{let v=0;for(let a=1;a<=m.faces;a++)for(let b=1;b<=m.faces;b++)if(a+b===m.target&&a!==b)v++;return X(`已知两枚点数不同，点数和仍为 ${m.target} 的概率是多少？`,F(v,m.faces*(m.faces-1)),'新的样本空间去掉所有点数相同的结果；分子也要重新检查是否有原先符合但点数相同的结果。')}
   case 'foldHoles':return X('把其中一个位于单条折痕边的孔移到内部，其余孔不变。展开后总孔数是多少？',Number(c.answer)+2,'该孔由两个镜像位置变成四个位置，增加2；不是一律乘4或总数加4。');
   case 'checkerDomino':return X('改为去掉左上角和右上角，其他条件不变，最多能放几块骨牌？',m.w*m.h/2-1,'去掉一黑一白，第一行剩偶数格可横铺，其余各行也可横铺。颜色数量允许且构造达到剩余格数的一半。');
   case 'natural-weighted':case 'natural-fractionWeighted':{
    const red=2*m.red,blue=m.blue,people=red+blue,redScore=F(m.redScore,m.den),blueScore=F(m.blueScore,m.den);
    const redTotal=F(red*m.redScore,m.den),blueTotal=F(blue*m.blueScore,m.den),total=F(red*m.redScore+blue*m.blueScore,m.den),average=F(red*m.redScore+blue*m.blueScore,people*m.den);
    const operand=v=>String(v).includes('/')?'('+v+')':String(v);
    return X('把红队人数变为原来两倍，蓝队人数不变，每人得分不变。新的平均分是多少？',average,
     `改变的是权重，不是每人得分；重新计算总份数和总得分，不能把原平均数直接加倍。按新人数比取红队 ${red} 人、蓝队 ${blue} 人的一组，共 ${people} 人。红队总分 ${red} × ${operand(redScore)} = ${redTotal}，蓝队总分 ${blue} × ${operand(blueScore)} = ${blueTotal}。合计 ${operand(redTotal)} + ${operand(blueTotal)} = ${total} 分。新平均 ${operand(total)} ÷ ${people} = ${average} 分。`);
   }
   case 'natural-catch':return X('小明追上后立即停住，让小乐再走原来的延迟时长，两人的距离是多少米？',m.slow*m.delay,'追上时领先距离归零；此后只有小乐移动，距离按他的速度与这段时间计算，差速不再适用。');
   case 'natural-tiles':return X('地面尺寸都变为两倍，并且允许重新选择最大的整块正方形砖。最少需要多少块砖？',m.w*m.h/(m.side*m.side),'长宽的最大公因数也变为两倍；砖面积与地面面积同时变为四倍，所以最少块数不变。');
   case 'natural-pairChance':return X('改成每次取球后放回并充分混合，再取第二次。两次都是红球的概率是多少？',F(m.red*m.red,(m.red+m.blue)**2),'放回后每次红球比例不变，两次概率相乘；原题第二次分母减1的规则失效。');
   case 'natural-unionChance':case 'natural-complementChance':return X('改为已知抽到的人至少参加了其中一组。这个人参加两组的概率是多少？',F(m.both,m.red+m.blue-m.both),'样本范围缩到至少一组的不同人数；用交集人数除以并集人数，不能仍除以全体。');
   case 'natural-offers':return X('价格规则不变，至少买多少件时甲店整单总价不高于乙店？件数必须是整数。',Math.ceil(m.fee/(m.price/4-1)),'每件价差与固定配送费共同决定临界数量。甲折后单价是原价的3/4，乙是原单价少1元；固定费除以每件差后向上取整数，再核对相邻件数。');
   case 'natural-angleRatio':return X(`另一个四边形的四个内角之比为 ${[...m.ratios,Math.max(...m.ratios)].join(':')}。最小内角是多少度？`,F(360*Math.min(...m.ratios),m.ratios.reduce((a,b)=>a+b,0)+Math.max(...m.ratios)),'四边形内角和为360°，共有新的四个比例份数；先确定图形的总角量，不能沿用三角形的180°。');
   case 'natural-digitCount':case 'natural-distinctDigitCount':return {...c.extension,kind:'condition-change',key:'repeat-permission'};
   case 'natural-coordinateDistance':return {...c.extension,kind:'condition-change',key:'grid-distance'};
   case 'routeProbability':return X('取消P的限制，随机路线第一步向上的概率是多少？',F(routes(m.w,m.h-1),routes(m.w,m.h)),'仍然是完整路线等可能。固定第一步向上后的路线数与全部路线数比较，不能默认两个方向各1/2。');
   case 'cubeProbability':return X('已知取到的小块至少一面涂色，恰好两面涂色的概率是多少？',F(12*(m.n-2),m.n**3-(m.n-2)**3),'样本空间变成外层小块，先排除完全未涂色的小块；符合数量仍为棱上非角的小块。');
   case 'overlapProbability':return X('改为只在第一张正方形的区域中等可能选点，落在重叠区域的概率是多少？',F((m.n-m.dx)*(m.n-m.dy),m.n*m.n),'重叠面积不变，可选整体从并集变成一个正方形，因此只改变分母。');
   case 'ratioUnion':return X('有一个原来只参加棋类组的人又加入球类组，其他人不变。新的棋类与球类人数之比为多少？请填写棋类人数除以球类人数。',F(m.a*m.unit,m.b*m.unit+1),'棋类人数不变，球类加1，交集也加1，不同人数不变。原比例不能沿用来重新分配全部人。');
   case 'chartAverage':return X('再来一个得6分的人，原来的其他人得分不变。新的平均分是多少？',F(2*m.counts[0]+4*m.counts[1]+6*m.counts[2]+6,m.counts.reduce((a,b)=>a+b,0)+1),'总分加6，总人数加1；平均数改变取决于新分数与原平均的关系。');
   case 'parityPermutations':return X('改为任意两个奇数都不能相邻，其余不变。有多少种排列？',fact(Math.floor(m.n/2))*choose(Math.floor(m.n/2)+1,Math.ceil(m.n/2))*fact(Math.ceil(m.n/2)),'先排偶数再把奇数放入空位，核对空位数量是否足够。原题奇偶可交换角色，但两类数量未必相同。');
   case 'recurrenceRemainders':return X(`前两项都改为2，递推规则不变，前 ${m.n} 项各自除以3的余数之和是多少？`,(()=>{let a=2,b=2,s=0;for(let i=0;i<m.n;i++){s+=a%3;[a,b]=[b,(a+b)%3]}return s})(),'数列加倍后，原余数1变2、2变1、0仍为0；余数的和不能直接加倍，需重算周期和及余段。');
   default:throw Error('Missing reviewed transfer: '+id);
  }
 }
 function polish(c,id){
  if(id==='percentRoundTrip'){
   const {start,percent}=c.math;
   c.methods=c.methods.map(m=>({...m,steps:[...m.steps]}));
   const parts=100/percent,first=start/parts,raised=start+first;
   c.methods[0].steps=[`把原价 ${start} 元分成 ${parts} 等份，${percent}% 是其中一份：${start}÷${parts}=${first} 元。加上这一份，涨后 ${raised} 元。`,
    `第二次以涨后 ${raised} 元为整体，再分成 ${parts} 等份，每份 ${F(raised,parts)} 元。减去这一份，剩 ${F(raised*(parts-1),parts)} 元；与原价相比少 ${F(first,parts)} 元。`];
  }
  const m=c.math;
  if(id==='fixedPerimeter'){
   const pairs=Array.from({length:Math.floor(m.half/2)},(_,i)=>[i+1,m.half-i-1]),a=Math.floor(m.half/2),b=m.half-a;
   c.methods=[M('列全长宽配对并比较',`由周长得到长+宽=${m.half}。交换长宽不改变面积，只列短边不大于长边的配对。`,pairs.map(([x,y])=>`${x}×${y}=${x*y}`).join('；')+'。',`比较全部合法面积，最大为${a}×${b}=${c.answer}。`),M('把较长一边挪给较短一边',`当长边比短边至少长2时，把长减1、短加1，长宽和不变。`,`增加的一排有“原长−1”个单位格，去掉的一排有“原短”个单位格；前者至少多1格，面积增加。`,`不断这样调整，直到两边相等或只差1，故最优边长${a}与${b}，面积${c.answer}。`)];
  }
  if(id==='recurrenceBackwards'){
   const seq=[m.first,m.second],coeff=[[1,0],[0,1]];for(let i=2;i<m.n;i++){seq.push(seq[i-1]+seq[i-2]);coeff.push([coeff[i-1][0]+coeff[i-2][0],coeff[i-1][1]+coeff[i-2][1]])}
   const p=coeff[m.n-2],q=coeff[m.n-1],x=seq[m.n-2],y=seq[m.n-1],det=p[0]*q[1]-q[0]*p[1],rhs=q[1]*x-p[1]*y;
   c.methods=[c.methods[0],M('用未知起点表示并消去第二项','设第1项为a，第2项为b，每个后续项都按同样的相加规则表示。',`第${m.n-1}项：${p[0]}a+${p[1]}b=${x}；第${m.n}项：${q[0]}a+${q[1]}b=${y}。`,`第一式乘${q[1]}，第二式乘${p[1]}再相减，b项抵消，得到${det}a=${rhs}，所以a=${m.first}。`,`代回得b=${m.second}；从这两项正向相加，可核对最后两个已知数。`)];
  }
  if(id==='signedProduct'){
   const cards=[-4*m.k,-3*m.k,-m.k,0,2*m.k,5*m.k],negative=[];for(let a=0;a<cards.length;a++)for(let b=a+1;b<cards.length;b++)for(let d=b+1;d<cards.length;d++){const v=cards[a]*cards[b]*cards[d];if(v<0)negative.push(`${cards[a]}×${cards[b]}×${cards[d]}=${v}`)}
   c.methods=[c.methods[0],M('列出负乘积逐个比较','有负乘积可选，零和正乘积都不会取得最小值；按数字卡顺序列每一组三张，避免重复。',negative.join('；')+'。',`所有负乘积都在这张列表内，比较得到最小值${c.answer}。`)];
  }
  if(id==='cubeSteps')c.methods=[M('把列高正反写成两行',`每列只有1块宽，块数为1+2+……+${m.n}。把这列高度再倒写一行。`,`两行同一列的和都是${m.n+1}，共${m.n}列，所以两倍块数=${m.n}×${m.n+1}。`,`除以2得到${c.answer}块；列数为奇数时也适用。`)];
  if(id==='openBox'){
   const choices=[];for(let x=1;2*x<m.side;x++)choices.push(`x=${x}时体积${x*(m.side-2*x)**2}`);
   c.diagram={kind:'boxNet',side:m.side};c.methods=[M('由展开图确定尺寸再比较',`每条底边的两端各少x，高为x，故底边=${m.side}−2x，体积=x×(${m.side}−2x)²。`,`x为正整数且底边为正，只需检查1到${(m.side-2)/2}。`,choices.join('；')+'。',`完整比较这些合法切角方案，最大体积为${c.answer}。`)];
  }
  if(id==='natural-angleRatio')c.diagram={kind:'angleRatioTriangle',ratios:[...m.ratios]};
  return c;
 }
 function edit(family,seed){
  const t=base.competitionCreate({engine:2,familyId:family.id,seed}),c={...t.competition},m=c.math;
  c.title=family.title;c.level=family.level;c.insight=family.insight;c.extension=transfer(family.id,m,c);
  if(oneMethod.has(family.id))c.methods=[c.methods[0]];
  if(family.id==='fractionBackwards')c.diagram=null;
  if(family.id==='fixedPerimeter')c.diagram={kind:'rectangle',labels:['长 ?','宽 ?',`周长 ${2*m.half}，边长为正整数`]};
  if(['paintedCube','cubeProbability'].includes(family.id))c.methods=[c.methods[0],M('按六个面计数再去重',`每个面边缘去掉四个角，剩4×${m.n-2}个有两个面涂色的小块，共计六个面。`,`每个这样的块在两个面中各计一次，所以总数6×4×${m.n-2}÷2=${12*(m.n-2)}。`+(family.id==='cubeProbability'?`再除全部${m.n**3}块得到概率。`:''))];
  if(family.id==='checkerDomino')c.methods=[M('颜色上界与达到上界的摆法',...c.methods[0].steps,...c.methods[1].steps)];
  if(family.id==='routeProbability')c.methods=[c.methods[0],M('直接逐点累加可行路线',`A写1，P写0；其余点写左边和下边的路线数之和，直接得到不经过P的${routes(m.w,m.h,[m.x,m.y])}条路线。`,`分母用不封闭P的同类路径表，得到${routes(m.w,m.h)}条。两者之比为${c.answer}。`)];
  return polish(c,family.id);
 }
 const COMPETITION_REVIEWED=rows.map(([id,level,title,insight])=>{const f=base.COMPETITION_CATALOG.find(x=>x.id===id);return {...f,level,title,insight,origin:'reviewed-rc60',build:seed=>edit({id,level,title,insight},seed)}}).concat(extra.COMPETITION_EXPANSION.map(f=>({...f,origin:'new-structure',build(seed){const c=f.build(seed);if(oneMethod.has(f.id))c.methods=[c.methods[0]];return polish(c,f.id)}}))).concat(fresh.COMPETITION_FRESH.map(f=>({...f,origin:'rc64-structure'}))).map(f=>({...f,levelReason:descriptions[f.level]+'；'+f.insight,benchmarkMatch:['signedProduct','digitDivisor','overlapAverages','ageDifference','lShapeArea'].includes(f.id)?'相近推理结构':'同领域推理参照，不宣称同构',benchmarks:benchmarkMap[f.id]||[],benchmarkKind:benchmarkMap[f.id]?'已复核台账中的结构参照，原创题不等同真题':'原创结构，未宣称对应已复核真题'}));
 COMPETITION_REVIEWED.push(...rules.catalog.map(f=>({...f,levelReason:descriptions[f.level]+'；'+f.insight,benchmarkKind:'原创规则题，未宣称对应真题',benchmarks:[]})));
 COMPETITION_REVIEWED.push(...structured.catalog);
 for(const f of COMPETITION_REVIEWED){f.reasoningKey=f.reasoningKey||rules.reasoningKey(f.id)||f.strategy;Object.assign(f,design.family(f))}
 const integrated=typeof module!=='undefined'?require('./competition_integrated'):CompetitionIntegrated;
 COMPETITION_REVIEWED.push(...integrated.catalog);
 for(const f of COMPETITION_REVIEWED)if(diagnosticFamilies.has(f.id))f.generatorRevision=6;
 function competitionReviewedEligible(ids){const scope=new Set(competitionCanonicalIds(ids));return COMPETITION_REVIEWED.filter(f=>f.topicIds.every(id=>scope.has(id)))}
 function competitionReviewedCreate(recipe){
  if(integrated.catalog.some(f=>f.id===recipe?.familyId))return integrated.create(recipe);
  const f=COMPETITION_REVIEWED.find(f=>f.id===recipe?.familyId),seed=recipe?.seed;
  const generatorRevision=recipe?.generatorRevision===undefined?1:recipe.generatorRevision;
  if(recipe?.engine!==3||!f||![1,2,3,4,5,6].includes(generatorRevision)||!Number.isInteger(seed)||seed<1||seed>2147483647)throw Error('Invalid reviewed competition recipe');
  if(generatorRevision===6&&!diagnosticFamilies.has(f.id))throw Error('Generator revision 6 is not registered for this family');
  if(generatorRevision===5&&f.id!=='natural-weighted')throw Error('Generator revision 5 is not registered for this family');
  if(f.id==='threeGroupBalance'&&generatorRevision!==4)throw Error('New family requires generator revision 4');
  const config=recipe.configurationId;
  if(config&&generatorRevision!==4)throw Error('New configurations require generator revision 4');
  let c=(generatorRevision===4&&(config||f.id==='threeGroupBalance'))?structured.create(f.id,config||'main',seed):null;
  if(!c){c=rules.decorate(f.build(seed,generatorRevision>=3?2:generatorRevision),f.id);if(generatorRevision>=3)c=design.revise(c,f,seed);if(config){c.configurationId=config;c.math={...c.math,configurationId:config}}}
  c=design.decorate(c,f,generatorRevision);
  if(f.id==='parityPermutations'&&config==='first-odd-transfer')c.quality.variationSpec={...c.quality.variationSpec,
   decision:'首位新增限制使第一个空隙不可用；重查可用空隙和不同数字的顺序',transferStrength:'changed-boundary'};
  else if(f.id==='parityPermutations')c.quality.variationSpec={...c.quality.variationSpec,
   transferStrength:c.math.n%2===0?'isomorphic-role-swap':'unequal-role-swap'};
  c=(typeof module!=='undefined'?require('./variation_state'):VariationState).normalize(c,f,generatorRevision);
  if(generatorRevision===5&&f.id==='natural-weighted'){
   const m=c.math,den=m.den||1,lo=Math.min(m.redScore,m.blueScore),hi=Math.max(m.redScore,m.blueScore),target=(lo+hi)/(2*den),count=m.red+m.blue,total=(m.red*m.redScore+m.blue*m.blueScore)/den,highCount=m.redScore>m.blueScore?m.red:m.blue,score=hi/den;
   let k=0;while(k<=highCount&&(count-k<=0||(total-score*k)>target*(count-k)))k++;
   if(k>highCount)throw Error('Unreachable weighted removal target');
   const prompt=`两队改为只让得分较高队的成员离开，其他人的每人得分不变。至少离开多少人，才能让剩余整体均分不超过${target}？`;
   c.quality={...c.quality,variationSpec:{...c.quality.variationSpec,change:'移除高分队成员，整体人数与总分同时变化',decision:'重建分子和分母并核对最少整数人数',transferStrength:'changed-whole-with-unknown-weight'}};
   c.extension={...c.extension,prompt,answer:String(k),key:'remove-high-to-target-v2',answerContract:{kind:'exact-rational',value:String(k),unit:'人',allowApproximation:false},math:{...m,target,highCount,score,count,total},diagram:null,solution:'移除成员时，总分和总人数同时变化；在合法整数人数中比较新均分。',solutionFrames:[],problemState:{...c.extension.problemState,math:{...m,target,highCount,score,count,total},expectedAnswer:String(k),normalizedModel:'population-removal',projection:{...c.extension.problemState.projection,diagram:null,diagramPhase:'variation-givens'},goal:{id:'remove-high-to-target-v2',quantityId:'removed-members',unit:'人'},answerContract:{kind:'exact-rational',value:String(k),unit:'人'},adapterStatus:'explicit'}};
  }
  c.sourceProvenance=sources.provenance(f.id,config);c.requiredSkillsByRoute=sources.definitions[f.id]?.routes||[];
  if([3,5,6].includes(generatorRevision)&&!config||generatorRevision===4&&f.id==='parityPermutations'&&config==='first-odd-transfer')c.skillContractKey=sources.skillContractKey(f.id);
  const authoredGraph=(typeof module!=='undefined'?require('./reasoning_graph'):ReasoningGraph).create(c);
  c.routes=authoredGraph.routes;c.reasoningCoverage=authoredGraph.coverageStatus;c.answerContract=c.problemState.answerContract;
  if(c.sourceProvenance.matchType==='full_structure'||f.id==='threeGroupBalance'){if(c.methods.length!==authoredGraph.routes.length)throw Error('Source method/route mapping mismatch');c.methods=c.methods.map((m,i)=>({...m,routeId:authoredGraph.routes[i].id}));}
  c.variantTransform={kind:'declared-family-change',conditionId:c.extension.key||'condition-transfer',description:c.quality.variationSpec.change,baseStateId:c.problemState.id,targetStateId:c.extension.problemState.id,normalizationStatus:c.extension.problemState.adapterStatus};
  if(authoredGraph.routes.length&&!c.rc68Diagram){const ns=authoredGraph.routes[0].nodes;c.ruleHints=[ns[0].prompt,ns[Math.min(1,ns.length-1)].prompt];c.hintDiagram={...c.diagram,stage:{kind:'hint',text:c.ruleHints[1]}}}
  const rc69Hints={
   coordinateHorizontal:['两点的哪个坐标相同？先确定要沿哪条数轴比较。','在同一条数轴上标出两个横坐标，检查从左点到右点跨过多少单位。'],
   repeatedOnes:['先试由1个1和2个1组成的数，比较除以7的余数。','在末尾添1相当于原数乘10再加1；只追踪余数，看看何时重复。'],
   mixedPacks:['必须恰好，还是至少买够？先保留满足数量要求的整包方案。','尝试不同包数，核对总支数是否合格，再比较费用；不要只比较单包价格。'],
   mapScale:['同一条路在两张地图上的长度怎样对应？','把原长度看成同样的一份，检查放大或缩小的是哪一张地图。'],
   riverTravel:['顺流和逆流时，船与水流的方向分别是什么？','先求两段实际速度，再检查去回路程相同是否代表时间也相同。'],
   telescopingDifferences:['同一个中间数在相邻两个括号中怎样出现？','先写出相邻的两项比较，检查哪些项会抵消；由你确认最后留下的端点。']
  };
  if(rc69Hints[f.id]){c.ruleHints=rc69Hints[f.id];c.hintDiagram={...c.diagram,stage:{kind:'hint',text:c.ruleHints[1]}};}
  // Presentation-only staged quantities leave historical mathematical identity intact.
  if(['recurrenceRemainders','consecutiveRepresentations','remainderProbability','rotatingColors','stepwiseRoute'].includes(f.id)){
   const graph=(typeof module!=='undefined'?require('./reasoning_graph'):ReasoningGraph).create(c),nodes=graph.routes[0].nodes;
   c.methods=c.methods.map(method=>({...method,frames:method.steps.map((text,step)=>({kind:'scene-stage',scene:{kind:'scene-quantities',quantities:nodes.slice(0,Math.max(1,Math.ceil((step+1)*nodes.length/method.steps.length))).map(n=>({label:n.prompt,value:n.answer,unit:n.unit})),caption:'按这条路线连接已经得到的量'},stage:{kind:'solution',step,text}}))}));
  }
  if(f.id==='rule-packs-enough'){
   const p=c.math.params,plans=[];for(let k=0;k<=Math.ceil(p.count/p.size);k++){const single=Math.max(0,p.count-k*p.size),cost=k*p.pack+single*p.single;if(cost===Number(c.answer))plans.push(`${k}包加${single}支单买`)}
   if(plans.length>1)c.methods[0].steps[c.methods[0].steps.length-1]+=' 同价最优方案：'+plans.join('；')+'。';
  }
  if(generatorRevision===6){
   const m=c.math,values=f.id==='digitInsert'
    ?[100*m.d+10*m.a+m.b,100*m.a+10*m.d+m.b,100*m.a+10*m.b+m.d,100*m.d+10*m.b+m.a,100*m.b+10*m.a+m.d]
    :[m.n*m.step,(m.n-1)*m.step,(m.n+1)*m.step,m.step,m.start+m.n*m.step];
   c.options=[...new Set(values.map(String))].sort((a,b)=>competitionHash('diagnostic-v1:'+f.id+':'+seed+':'+a).localeCompare(competitionHash('diagnostic-v1:'+f.id+':'+seed+':'+b)));
   c.optionDesign={revision:1,scope:'generated_training_only',kind:f.id==='digitInsert'?'legal-position-and-order':'term-count-and-endpoint',legacyGeneratorRevision:3};
   c.misconceptions=f.id==='digitInsert'
    ?[{value:String(100*m.a+10*m.d+m.b),feedback:'这次插入保留了原数字顺序。再从最高位开始比较，哪一个位置能得到更大的数？'},{value:String(100*m.a+10*m.b+m.d),feedback:'末尾插入是合法位置。最大值要把各个合法位置都比较一次。'}]
    :[{value:String((m.n-1)*m.step),feedback:'检查你数的是端点还是相邻的差；从第一项到最后一项，每个括号都算一次。'}];
  }
  const ids=competitionCanonicalIds(f.topicIds);
  const identityMath=f.origin==='rc65-rules'?{ruleVersion:c.math.ruleVersion,variant:c.math.variant,params:c.math.params}:c.math;
  // RC65 identities are immutable. New fractional recipes distinguish reviewed
  // countable-item and volume domains rather than silently conflating units.
  if(generatorRevision>=2&&f.origin==='rc65-rules'&&c.relationModel.key==='fraction-wholes')identityMath.quantityDomain=c.math.context==='supplies'?'count-items':'volume-litre';
  const signature=JSON.stringify({engine:1,topicIds:ids,family:c.family,math:identityMath}),id='COMP-'+competitionHash(signature);
  if(!c.prompt||c.clues||!c.extension||c.options.length!==5||new Set(c.options).size!==5||!c.options.includes(c.answer)||c.methods.length<1||c.methods.length>3)throw Error('Invalid reviewed competition content');
  const extension={...c.extension,key:c.extension.key||'condition-transfer'};
  extension.signature=JSON.stringify({main:signature,variation:extension.key});
  if(extension.topicIds&&!extension.topicIds.every(t=>ids.includes(t)))throw Error('Variation outside main scope');
  const restoredRecipe={engine:3,familyId:f.id,seed};if(recipe.generatorRevision!==undefined)restoredRecipe.generatorRevision=generatorRevision;if(config)restoredRecipe.configurationId=config;
  return {id,contentVersion:generatorRevision===6?153:revision,skillId:ids[0]+'.01',phase:'挑战',mode:'competition',prompt:c.prompt,options:c.options,optionIds:c.options.map(v=>id+':'+v),answer:c.options.indexOf(c.answer),competition:{...c,reasoningKey:f.reasoningKey,hints:c.ruleHints||[f.insight],level:f.level,levelReason:f.levelReason,insight:f.insight,benchmarks:f.benchmarks,benchmarkKind:c.sourceProvenance.matchType==='full_structure'?'四个首批来源的完整结构配置，本地数学与结构已核验；整版发布验收待完成':'原创配置；历史索引仅作领域参考，未宣称完整同构',extension,signature,topicIds:ids,recipe:restoredRecipe}};
 }
 function competitionReviewedRecipe(familyId,seed){return {engine:3,familyId,seed,generatorRevision:integrated.catalog.some(f=>f.id===familyId)?5:familyId==='threeGroupBalance'?4:familyId==='natural-weighted'?5:diagnosticFamilies.has(familyId)?6:3,...(integrated.catalog.some(f=>f.id===familyId)?{configurationId:integrated.config[familyId][0]}:{})}}
 return {COMPETITION_REVIEWED,competitionReviewedEligible,competitionReviewedCreate,competitionReviewedRecipe};
})(typeof module!=='undefined'?require('./competition_catalog'):{COMPETITION_CATALOG,competitionCreate:competitionCatalogCreate},typeof module!=='undefined'?require('./competition_expansion'):{COMPETITION_EXPANSION},typeof module!=='undefined'?require('./competition'):{competitionCanonicalIds,competitionHash,competitionFraction,competitionRatioText},typeof module!=='undefined'?require('./competition_fresh'):{COMPETITION_FRESH},typeof module!=='undefined'?require('./competition_rules'):CompetitionRules,typeof module!=='undefined'?require('./competition_design'):CompetitionDesign,typeof module!=='undefined'?require('./structured_recipes'):StructuredRecipes,typeof module!=='undefined'?require('./source_catalog'):SourceCatalog);
if(typeof module!=='undefined')module.exports={COMPETITION_REVIEWED,competitionReviewedEligible,competitionCreate:competitionReviewedCreate,competitionReviewedRecipe};

