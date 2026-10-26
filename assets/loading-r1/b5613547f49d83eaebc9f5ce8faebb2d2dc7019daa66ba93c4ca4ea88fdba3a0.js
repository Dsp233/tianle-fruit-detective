'use strict';
// RC67: explicit adapters read mathematical data, never reverse-parse a story.
// Presentation is independent of the immutable mathematical recipe version.
const CompetitionDesign=((h,rules)=>{
 const {competitionRng:rng,competitionFraction:F,competitionNumericOptions:options}=h;
 const copy=x=>JSON.parse(JSON.stringify(x)),sum=a=>a.reduce((s,x)=>s+x,0);
 const method=(name,...steps)=>({name,steps});
 const configs={};
 function define(ids,model,goal,change,constraints){for(const id of ids.split(' '))configs[id]={model,goal,change,constraints}}
 define('reverseDigits digitInsert numberAppend divisibleDigits divisibleEleven natural-digitCount natural-distinctDigitCount digitComplement differentDigits digitDivisor','place-and-choice','数位或有序位置中的合法选择','改变位置、重复规则或目标，重新检查合法选择','各位置按题目顺序；首位和零的限制不能省略');
 define('fractionBackwards fractionDifferentWholes fractionSharedRemainder rule-fraction-reverse rule-fraction-original','changing-wholes','对应整体下的使用量或原量','改变分数所对应的整体','离散物品的每一步数量必须为整数；水量允许分数');
 define('percentRoundTrip percentRestore discountOrder natural-offers','changing-base','当前基准下的价格或临界数量','改变基准、顺序或比较目标','百分比作用于明确的价格；配送费只加一次');
 define('ratioEqualize ratioTotal linkedRatios transferBetweenBoxes ratioUnion','ratio-and-conservation','份数对应的实际数量','区分外部增加、内部转移与交集变化','份数不等于实际个数；转移不改变两边总量');
 define('packPrice mixedPacks rule-packs-exact rule-packs-enough','finite-purchase','合法购买方案中的最低费用','恰好与至少的数量边界','包装不可拆；单件和整包均非负整数；覆盖全部有限候选');
 define('equalDistanceSpeed natural-catch riverTravel jointWork stagedClimb','rate-and-boundary','时间、距离或加权速度','改变时间权重、移动规则或停止边界','速度单位一致；到达后是否继续运动须明确');
 define('oppositeScale mapScale scaleAreaReverse similarAreaPerimeter shadowSimilarity parallelTriangle','length-and-area-scale','长度倍率与面积倍率','改变倍率、光照或所求区域','相似的对应长度用同一倍率；面积倍率平方');
 define('balanceCancel tickets twoCoins stampConstraint machineMeeting','balance-and-constraints','同时满足总量与差额的未知数','改变一个约束并重新检查解集','金额和人数限制共同生效；票、硬币和邮票为完整个体');
 define('recurrenceBackwards recurrenceForward recurrenceTotal recurrenceRemainders','recurrence','初始条件及相邻项确定的数列','改变初始条件或累计区间','项号从1开始；初始项不套用第三项规则');
 define('linearTable repeatedMachine machineOrder','affine-operations','按指定顺序的机器输出','改变运算顺序或共同输入','先乘后加与先加后乘分别绑定；相同输入不会自动消去全部加数');
 define('factorBalance threeDivisors divisorPowers equalBags natural-tiles','factor-constraints','合法因数或共同规格','改变极值目标、袋数要求或缩放','正整数因数必须覆盖；规格能完整划分对象');
 define('bells offsetBells lastDigit cyclicPosition repeatedOnes','cycle-and-endpoints','循环位置或共同事件','改变方向、起止端点或追加一位','明确起点计不计；余数0对应完整周期而非首位置');
 define('fixedPerimeter boundaryNotch squareBorder rectangleDiagonalArea lShapeArea crossArea overlapSquares','boundary-and-area','边界、面积和新增部分','改变缺口位置、覆盖次数或合法边长','正尺寸；同一边界不重计；面积和周长分别求解');
 define('outsideAngle natural-angleRatio angleMarks polygonTurn semicircleBoundary circleRoute circleRingRatio','angle-and-circle','角量、弧长与完整边界','改变图形总量、行走方向或直边是否外露','按指定圆周率；弧和直径属于不同边界部分');
 define('ladderShift natural-coordinateDistance coordinateHorizontal hypotenuseMidpoint','distance-geometry','直线距离和对应直角边','改变已知边、路径限制或中点位置','坐标差与坐标值分开；网格行走不是直线距离');
 define('paintedCube cubeProbability cubeSteps openBox','spatial-boundary','空间位置分类或合法体积','改变涂色面、层数、样本空间或可用材料','角、棱、面不重复；盒底与高为正；遮挡不改变数量');
 define('exactlyOneSet setOutside threeSetExactlyTwo natural-unionChance natural-complementChance','sets-and-multiplicity','交集与补集中的不同对象','改变交集或样本范围','所有人数为整数；交集属于各组，不能重复计总人数');
 define('gridDetour routeProbability stepwiseRoute','route-and-sampling','受限制路径及其机会','改变路径限制或随机选择规则','完整路线等可能与每个岔口等可能是不同实验');
 define('adjacentLine restrictedTeam unorderedPairs circularSeating parityPermutations menuBranches binaryNoNeighbors allThreeColors rotatingColors','arrangement-and-equivalence','合法排列、分类或等价类','改变相邻限制、样本角色、旋转等价或可用类别','有序/无序和旋转等价明确；分类互斥且完整');
 define('chartScale chartAverage truncatedBars cumulativeChart','chart-and-scale','图表刻度及非重计总量','改变柱高、档位或累计区间','起点、每格、累计/单档须区分；不把图高当总量');
 define('missingAverage natural-weighted natural-fractionWeighted rule-weighted-mean rule-weighted-score overlapAverages medianSort','total-and-position','权重、总和或排序位置','改变人数、重叠位置、删放次数或极端值','人数权重不等时不能直接平均两组；重叠只能扣一次');
 define('diceSum natural-pairChance conditionalBalls spinnerLabels remainderProbability overlapProbability','sample-space','等可能具体结果中的有利部分','改变放回规则、条件样本空间或卡片范围','概率分母对应真正等可能对象；条件变化要同时复核分子');
 define('foldHoles quarterTurn transformOrder','transformation','同一对象在变换后的对应位置','改变折痕位置、转向或操作顺序','折痕上的点与内部点复制次数不同；镜像与旋转不可任意交换');
 define('checkerDomino lightSwitchParity ballReplacement worstCaseColors','invariant-and-guarantee','不变量给出的限制或最坏失败方案','改变颜色约束、开关次数或保证目标','上界须有达到它的构造；保证问题先构造最大失败情况');
 define('pairedSum telescopingDifferences neighborProducts consecutiveRepresentations squareBounds signedProduct','structure-and-domain','配对、消去、平方界或符号筛选','改变累计范围、允许的首项、因子个数或上下界','检查完整合法候选；负号、首项与非平方边界保留');
 define('rule-join-open rule-join-closed rule-join-piece','joined-length','连接后总长度或单段长度','长条改闭环，首尾是否新增连接处','每个连接处只扣一次重叠；材料必须适合弯曲或直排');
 define('rule-posts-both rule-posts-neither','interval-endpoints','间隔与标记的对应','两个端点计入与否','距离能被间隔整除；内部点与端点明确');
 define('rule-ratio-length rule-ratio-perimeter','ratio-perimeter','长宽份数与半周长','改变已知量、目标或整体尺度','周长是两条长和两条宽；长宽均正');
 define('unitConversion','unit-conversion','把容量转换为同一单位再求杯数','改变单杯容量','升和毫升不能直接相除；完整杯数为整数');
 define('ageDifference','constant-age-gap','同一年龄差下的倍数关系','改变时间和年龄倍数','同时长一岁不会改变年龄差；过去和现在的年龄不能混用');
 define('rectanglePointAreas','shared-height-balance','同一长方形中相对三角形的面积和','只平移内部点并改变所求面积','点在内部；相对三角形共享等长底边，两条高的和固定');
 const variations={};
 const variation=(ids,category,recheck)=>{for(const id of ids.split(' '))variations[id]={category,recheck}};
 variation('reverseDigits','dependency','位值差换成数字差；由互换后两数之和还原数字和，再确定较小数');
 variation('digitInsert factorBalance','goal','在同一完整合法候选集合中把最大和最小目标互换');
 variation('numberAppend','dependency','追加的数字从个位移到百位，原数的位值不再整体乘10');
 variation('fractionBackwards fractionSharedRemainder rule-fraction-original','whole','第二次分数的整体在原量与余量之间改变，重建两次用量关系');
 variation('rule-fraction-reverse','whole','第二次分数改以第一次用量为整体；第一次用量与余量不相等');
 variation('fractionDifferentWholes','goal','所求从两盒取出量改为余量；各盒分数仍分别对应各自整体');
 variation('percentRoundTrip percentRestore','whole','恢复原价需要除以变化后的价格，不能沿用原百分数');
 variation('discountOrder linearTable repeatedMachine transformOrder','dependency','互换两步操作，追踪先操作的增量是否被后一步乘或反射');
 variation('squareBorder','boundary','完整外圈改为左上两边，新增外角与两条边分别只计一次');
 variation('ratioEqualize','goal','只加红球改为只减蓝球；相等后的数量对应原来的红球量');
 variation('ratioTotal transferBetweenBoxes','dependency','外部只向一边加入，数量差只缩小加入量；内部转移会同时改变两边');
 variation('linkedRatios','goal','只变蓝色到与绿色相等；原两个比例不再同时保持');
 variation('packPrice mixedPacks rule-packs-exact','constraint','数量恰好改为至少，额外整包成为合法候选；重新比较边界方案');
 variation('rule-packs-enough','constraint','禁止单买并要求恰好；先检查整包整除可行性，再考虑费用');
 variation('equalDistanceSpeed','whole','等路程改为等时间，平均速度使用的时间权重改变');
 variation('natural-catch','dependency','追上后快者停止，之后间距增长率由慢者速度决定');
 variation('jointWork riverTravel','dependency','取消一人工作或水流后，各段有效速率改变，总工作量或路程保留');
 variation('stagedClimb','boundary','白天到达后停止改为每夜都回退，比较完整昼夜位置而非白天峰值');
 variation('oppositeScale','constraint','取消面积固定，两个长度同倍率改变，面积使用倍率平方');
 variation('mapScale scaleAreaReverse','dependency','增加或取消一次缩放，每个长度倍率对应各自的阶段整体');
 variation('similarAreaPerimeter','dependency','由周长倍率求面积倍率，改走长度到面积的方向');
 variation('shadowSimilarity','invariant','光照改变使同一时刻两杆影长同倍率缩短，高度仍不变');
 variation('parallelTriangle','whole','改为半边长的小相似三角形，梯形占比需要先平方再取补集');
 variation('natural-tiles','invariant','地面加倍且允许重新选最大砖，地面与砖的面积同乘4，块数保持');
 variation('unitConversion','invariant','总容量不变，每杯容量加倍，完整杯数按反比改变');
 variation('balanceCancel','dependency','只从天平右边移去一个盒子，需在同侧补回其重量');
 variation('tickets stampConstraint','constraint','解除总人数或两种都须出现的约束；重新列完整非负整数解');
 variation('twoCoins','goal','每种各取一枚后求总金额，减少的金额与减少的枚数不同');
 variation('ageDifference','invariant','改问未来2倍年龄时刻，年龄差保持，倍数对应的时间改变');
 variation('recurrenceBackwards','dependency','只增加第一项，增量从1、0开始同规则递推，第二项保持');
 variation('recurrenceForward','dependency','交换不相等的初始项，按同一规则重新推进到指定项号');
 variation('recurrenceTotal','boundary','累计区间去掉第一项，起点和消去后的剩余边界改变');
 variation('recurrenceRemainders','dependency','初始项加倍但取余不是线性求和，1与2的余数类别交换');
 variation('machineMeeting','dependency','只给甲输出加1，共同输出的交点改变，差速保持');
 variation('machineOrder','invariant','共同输入加倍，两个合成式的输入项仍抵消，检查差由常数项决定');
 variation('divisibleDigits','constraint','末位被5整除改为偶数，再与数字和被9整除联合筛选');
 variation('digitDivisor','constraint','允许个位为0不能使除以0有定义，区分规则非法与计数增加');
 variation('divisibleEleven threeDivisors','goal','保留完整合法列表，从取最大或计数改为计数或取最大');
 variation('divisorPowers','constraint','只保留平方因数，各质因数指数必须为偶数');
 variation('equalBags','constraint','不再要求袋数最多，袋数必须是共同规格的因数，不能任取');
 variation('bells rule-posts-both rule-posts-neither','boundary','重新核对起点和终点是否计入，间隔数不等于点数');
 variation('offsetBells','boundary','从实际第一次共同响继续一个共同周期，不以第0分钟替代实际起点');
 variation('lastDigit','goal','从一个幂的末位改为两个相邻幂之和的末位，需分别定位并再取个位');
 variation('cyclicPosition quarterTurn','dependency','从同一个起点逆向走或转，余步相同但位置对应方向相反');
 variation('repeatedOnes','dependency','末尾添1把当前余数映射为10倍加1再取余，不能直接把余数加1');
 variation('fixedPerimeter','constraint','最大面积改为边长至少3时的最小面积，合法边界和极值方向同时改变');
 variation('rectangleDiagonalArea','invariant','只有长乘3/2，三角形仍占长方形一半，面积只随这一个长度变化');
 variation('boundaryNotch','boundary','中间凹口改为内部洞，外边没有被替换，内外两圈边界都要计入');
 variation('outsideAngle','goal','已知同一外角改求另一个底角，使用互补与等腰对应关系');
 variation('angleMarks','goal','较短方向角改为另一个方向围角，两个目标合计一整圈');
 variation('polygonTurn','boundary','只累计实际经过的顶点，奇数顶点的取整规则不能省略');
 variation('overlapSquares','goal','至少一张覆盖改为恰好一张，交集从扣一次改为扣两次');
 variation('lShapeArea','invariant','缺口移到内部，轮廓改变但挖去面积不变；重新核对所求仍为面积');
 variation('crossArea','goal','并集面积改为交叉面积，重计修正与目标区域不同');
 variation('circleRoute','constraint','较短补弧改为往返且覆盖全圆，目标受覆盖下界限制');
 variation('semicircleBoundary','boundary','两块沿直径合回整圆，原直径变成内部接触边不计外周');
 variation('circleRingRatio','invariant','半径都加倍，分子分母面积同乘4，占比保持');
 variation('ladderShift','dependency','固定梯长，把高度作为已知边求底距，已知未知位置交换');
 variation('coordinateHorizontal','invariant','两点同时平移，坐标差保持，不能把平移量加到距离');
 variation('natural-coordinateDistance','constraint','直线移动改为只走水平竖直网格，最短距离的合法路径集合改变');
 variation('hypotenuseMidpoint','dependency','中点移到较长直角边，不能沿用斜边中点到三顶点等距的关系');
 variation('paintedCube','constraint','只涂互不相邻的顶底面，恰好一面涂色分类改为两个完整表层');
 variation('cubeSteps','invariant','每列前后厚度都加倍，所有层数量加倍，列高关系保留');
 variation('openBox','goal','固定剪角为1并改求底面积，不再枚举体积最大值');
 variation('exactlyOneSet setOutside','dependency','同一个人增加另一个组，组计数可增两次，不同人数只增一次');
 variation('ratioUnion','dependency','同一位只在棋组的人加入球组，球组和交集同时加1，不同总人数保持，原比例失效');
 variation('threeSetExactlyTwo','goal','恰好两组改为至少两组，三组交集应只加回一次');
 variation('gridDetour routeProbability','constraint','避开P改为固定第一步向上，不再扣通过P的路线');
 variation('menuBranches','dependency','饮料选择作用于整份午餐，包括米饭和面两种互斥分支');
 variation('binaryNoNeighbors','constraint','第一盏必须亮会迫使第二盏灭，不能把全部安排简单减半');
 variation('adjacentLine','constraint','必须相邻改为不能相邻，用完整排列集合减相邻集合');
 variation('restrictedTeam','constraint','禁止两人同时入选改为必须同选，无职位的剩余位置只选第三人');
 variation('unorderedPairs differentDigits','constraint','是否分职位或交换顺序算不同改变，成对重复计数因子改变');
 variation('circularSeating','constraint','去掉相邻限制，但仍需固定旋转参照，镜像规则保持');
 variation('parityPermutations','constraint','奇偶交换限制角色，重查主体人数和空位是否足够，不能只改名称');
 variation('digitComplement','constraint','至少出现一次改为恰好一次，其他位置禁止再出现该数字');
 variation('allThreeColors','constraint','三色全出现改为恰好两色，先选颜色组再排除两种纯色');
 variation('natural-digitCount natural-distinctDigitCount','constraint','允许或禁止同一个数字重复使用，再与整除条件联合筛选');
 variation('chartScale','dependency','所有柱各加一格但刻度保持，总人数增加量由柱数乘每格人数');
 variation('truncatedBars','goal','实际总人数改为人数差，共同纵轴起点只在相减时抵消');
 variation('cumulativeChart','goal','改变实际分数档，累计上界之差对应新的目标区间');
 variation('chartAverage','dependency','新增一名6分者，总分与人数同时改变，重新核对平均权重');
 variation('missingAverage','dependency','被删数放回两次，总和和人数都增加，不能只改平均数');
 variation('medianSort','invariant','只增加最大值，排序中间位置保持；中位数与平均数响应不同');
 variation('overlapAverages','dependency','前后段从4+4改为5+5，唯一重叠位置从第4个移到第5个，总和乘数改变');
 variation('natural-weighted natural-fractionWeighted','whole','交换两队人数权重，个人积分不变，重新确定两组总分占比');
 variation('rule-weighted-mean rule-weighted-score rule-ratio-length rule-ratio-perimeter','dependency','沿用明确比例但交换已知和未知，重新确定总量、份量和所求的依赖方向');
 variation('diceSum natural-unionChance natural-complementChance cubeProbability spinnerLabels conditionalBalls overlapProbability','sampling','新条件或区域改变等可能样本空间，分子分母都需重新检查');
 variation('natural-pairChance','sampling','不放回改为放回，第二次红球数和总数保持，具体结果的概率关系改变');
 variation('stepwiseRoute','sampling','每岔口等概率改为完整路线等概率，同一P的路径权重改变');
 variation('foldHoles','dependency','一个孔从单折痕移到内部，对称复制次数由2改为4');
 variation('checkerDomino','constraint','去除两同色角改为一黑一白，颜色上界改变，还需给达到上界的铺法');
 variation('lightSwitchParity ballReplacement','invariant','只增加一次翻转或一个白球，使决定最终状态的奇偶改变');
 variation('pairedSum telescopingDifferences','boundary','求和只留偶数或去掉首项，配对和消去后的端点改变');
 variation('neighborProducts','invariant','对称偏移从1改为2，中间一次项仍抵消，差等于偏移的平方');
 variation('squareBounds','goal','不超过平方根改为不小于，非平方数的两侧整数不同');
 variation('signedProduct','constraint','改为选两张而非三张，负乘积需要的符号组合及枚举集合改变');
 variation('rule-join-open rule-join-closed rule-join-piece','boundary','长条与闭环互换，首尾闭合会增一个连接处；单段未知先还原各段总和');
 variation('rectanglePointAreas','invariant','P水平移动，左右三角形面积和保持，上下两块不变，重新定位改变的区域');
 variation('worstCaseColors','constraint','提高保证的同色数量，各色最大失败取数受库存上界共同限制');
 variation('consecutiveRepresentations','constraint','首项允许0，新增写法只能从0开始，是否新增必须独立检查三角数条件');
 variation('remainderProbability','sampling','加入写0卡，分母必增1，分子仅目标余数为0时增加');
 variation('rotatingColors','constraint','加入固定星标后旋转不再合并，每个递增红位置集合单独计数');
 variation('natural-offers','goal','两店单次费用差改为最低整数购买量，固定配送费与每本价差确定临界点');
 variation('natural-angleRatio','whole','三角形改为四边形，总角量从180改360，比例份数及所求角同步改变');
 const hintPolicy={
  'place-and-choice':'把不同位置分别列出，再用题目的零、重复、整除或数位条件筛选。哪些选择先被排除？',
  'changing-wholes':'给每次分数圈出它的整体。后一次的整体是原量、余量，还是前一次的用量？',
  'changing-base':'把每个百分比连到它实际作用的价格。固定金额和百分比作用于同一个量吗？',
  'ratio-and-conservation':'画同一大小的份数。改变一边时，另一边是否也同时改变？',
  'finite-purchase':'先判定数量是否满足限制，再比较完整方案的费用。允许多买时，边界外哪一个整包方案需要补查？',
  'rate-and-boundary':'把每段经过的时间、距离和停止规则分开。最后一步还会发生下一次变化吗？',
  'length-and-area-scale':'先找对应长度的倍率，再判断所求量含一个长度还是两个长度。',
  'balance-and-constraints':'先固定一种数量，看另一种数量能否同时满足总量与差额；不能只核对一个条件。',
  'recurrence':'标清项号，从已知的相邻两项向需要的方向推进。改变初始项后，增量是否也遵守同一规则？',
  'affine-operations':'把输入沿箭头依次送进每一步。先加的量会不会在后一步被乘？',
  'factor-constraints':'把合法因数配成完整的一对，检查所有边界，再比较题目要的是最大还是最小。',
  'cycle-and-endpoints':'先找一次完整循环，再从原起点数余下部分；检查起点与终点的计数规则。',
  'boundary-and-area':'沿轮廓或新增部分观察。哪些只是替换，哪些确实多出？面积与边界长度分别计算。',
  'angle-and-circle':'先确定完整图形的角总量或一周边界，再检查直边、补弧与转角的角色。',
  'distance-geometry':'只使用已知的边或坐标差。所求是直线、网格路线，还是中点到顶点？',
  'spatial-boundary':'按空间位置分组：角、棱、面、内部是否重复？先确认每块属于哪一类。',
  'sets-and-multiplicity':'追踪一个同时参加多组的人，在各项中被数了几次；目标希望最终保留几次？',
  'route-and-sampling':'在格点上标合法出口。题目随机的是每个岔口，还是已经完整列出的路线？',
  'arrangement-and-equivalence':'找一个不会重复的分类或参照位置。交换顺序、旋转和镜像分别算不算不同？',
  'chart-and-scale':'先看坐标起点、每格和累计含义；新增一格或减少一档分别对应什么数量？',
  'total-and-position':'平均数要和人数一起看；中位数要和排序位置一起看。哪一个整体或位置固定？',
  'sample-space':'先列真正等可能的具体对象，再圈出符合条件的部分；新条件排除了哪些结果？',
  'transformation':'逐步追踪同一点或方向，不跳过中间操作；位于折痕和内部的点是否相同？',
  'invariant-and-guarantee':'检查一次操作能改变什么、保留什么；保证问题先构造仍会失败的最多数量。',
  'structure-and-domain':'先按合法符号、位置或边界分类，再看能否配对、消去或用相邻平方夹住。',
  'joined-length':'数连接处而不是只数材料段；首尾闭合后是否还多一个连接处？',
  'interval-endpoints':'先区分线段间隔与圆点标记；两端加入或去掉时改变的是哪个数量？',
  'ratio-perimeter':'沿长方形走一周，有几条长和几条宽？一条长加一条宽对应哪部分周长？',
  'unit-conversion':'把总量和每份容量都写成相同单位，再比较有多少个完整份。',
  'constant-age-gap':'把过去、现在和未来分开；两人一起长大时，哪个差保持不变？',
  'shared-height-balance':'把相对的两块三角形放在一起，观察相同底边和两条高的总长度。'
 };

 function load(c,f){
  const id=f.id,m=c.math,p=m.params||m;
  const enumerations={fixedPerimeter:Math.floor(m.half/2),factorBalance:Math.floor(Math.sqrt(m.product)),signedProduct:20,divisibleDigits:20,divisibleEleven:20,openBox:Math.floor((m.side-1)/2),stampConstraint:Math.floor(m.total/3),consecutiveRepresentations:Math.floor(Math.sqrt(2*m.total)),rotatingColors:2**m.n};
  const enumeration=enumerations[id]||(/packs|packPrice|mixedPacks/.test(id)?Math.ceil((p.count||0)/(p.size||4))+1:0);
  const shortcut=['pairedSum','telescopingDifferences','neighborProducts','machineOrder','recurrenceTotal','lightSwitchParity','ballReplacement','boundaryNotch'].includes(id);
  const fractional=['natural-weighted','natural-fractionWeighted'].includes(id)?c.answer.includes('/')||m.den!==1:/fraction|percentRestore|Probability|Chance|diceSum|spinnerLabels|mean/.test(id);
  const answerMagnitude=String(c.answer).split('/').map(Number).filter(Number.isFinite);
  const digits=Math.max(...Object.values(p).filter(x=>typeof x==='number').concat(answerMagnitude).map(x=>String(Math.abs(Math.trunc(x))).length),1);
  const operations=shortcut?2:Math.min(8,c.methods[0].steps.length+Number(fractional));
  const score=operations+Number(fractional)*2+Number(digits>2&&!shortcut)*2+Number(digits>3&&!shortcut)*2+Number(enumeration>12)*3;
  return {reasoningLoad:{level:f.level,reason:f.insight},calculationLoad:{level:score<=4?1:score<=7?2:3,operations,fractional,enumeration,digits,reason:shortcut?'可利用已定义的消去、配对或不变量简算':`有效路线约 ${operations} 步${fractional?'，含分数或比值':''}${enumeration?`；需检查至多 ${enumeration} 个候选`:''}`},readingLoad:{level:c.prompt.length<100?1:c.prompt.length<165?2:3,characters:c.prompt.length,reason:'按一个情境、目标和必要限制的实际文本长度估计'}};
 }

 function revise(c,f,seed){
  const r=rng(seed),id=f.id;
  if(id==='packPrice'){
   const single=3+r(6),branch=r(3),count=6+3*r(3)+(branch===2?1:2),pack=branch===0?single+1+r(single-1):branch===1?2*single:2*single+1+r(single-1);
   const full=Math.floor(count/3),loose=count%3,exact=full*pack+loose*single,extra=(full+1)*pack,answer=String(exact);
   c={...c,math:{single,pack,count},answer,options:options(answer,r),prompt:`一种笔单支 ${single} 元，3 支装每包 ${pack} 元。可以混合买，但必须恰好买 ${count} 支。最少花多少元？`};
   c.methods=[method('逐个比较合法包数',`整包不能拆，包数从0到 ${full}；余下的笔单买。`,`每包比3支单买少 ${3*single-pack} 元，所以合法范围内包数越多越省。`,`买 ${full} 包、单买 ${loose} 支，费用 ${full}×${pack}+${loose}×${single}=${exact} 元。`)];
   c.extension={prompt:'数量条件改为至少买够，允许多买；最少需要多少元？',answer:String(Math.min(exact,extra)),solution:`必须补查 ${full+1} 包的方案：共 ${(full+1)*3} 支，费用 ${extra} 元。原来的恰好方案为 ${exact} 元。${extra<exact?'多买反而更省':extra===exact?'两种方案费用相同':'恰好方案更省'}，最低 ${Math.min(exact,extra)} 元。`,kind:'condition-change',math:{single,pack,count,atLeast:true}};
  }
  if(id==='mixedPacks'){
   const p=9+r(6),branch=r(3),q=branch===0?p-1-r(3):branch===1?p:p+3+r(3),count=8+6*r(3),plans=[];
   for(let a=0;a<=Math.ceil(count/4);a++)for(let b=0;b<=Math.ceil(count/6);b++)if(4*a+6*b>=count)plans.push({a,b,bought:4*a+6*b,cost:a*p+b*q});
   const exact=plans.filter(x=>x.bought===count).sort((a,b)=>a.cost-b.cost)[0],enough=plans.sort((a,b)=>a.cost-b.cost||a.bought-b.bought)[0],answer=String(exact.cost);
   c={...c,math:{p,q,count},answer,options:options(answer,r),prompt:`笔只有4支装和6支装，分别 ${p} 元、${q} 元。必须恰好买 ${count} 支，不能拆包。最少花多少元？`};
   c.methods=[method('固定一种包数，完整检查另一种',`4支装从0包到 ${Math.floor(count/4)} 包；余下数量必须能被6整除。`,`逐个核对 4×包数+6×包数=${count}，再比较所有合法方案费用。`,`最低方案：4支装 ${exact.a} 包、6支装 ${exact.b} 包，${exact.a}×${p}+${exact.b}×${q}=${exact.cost} 元。`)];
   c.extension={prompt:'如果允许买超过需要的数量，最少花多少元？',answer:String(enough.cost),solution:`分别检查4支装至 ${Math.ceil(count/4)} 包、6支装至 ${Math.ceil(count/6)} 包，数量至少 ${count}。最低买4支装 ${enough.a} 包、6支装 ${enough.b} 包，共 ${enough.bought} 支，${enough.cost} 元。边界外的方案也必须比较，不能只看原来的恰好方案。`,kind:'condition-change',math:{p,q,count,atLeast:true}};
  }
  if(id==='natural-weighted'||id==='natural-fractionWeighted'){
   const red=1+r(3),blue=red+1+r(2),low=2+r(4),high=low+(id==='natural-weighted'?(red+blue)*(1+r(2)):2+r(4)),total=red+blue;
   c={...c,math:{red,blue,redScore:low,blueScore:high,den:1,total},answer:F(red*low+blue*high,total)};
   c.prompt=`红队与蓝队人数比为 ${red}:${blue}。红队每人得 ${low} 分，蓝队每人得 ${high} 分。所有队员的平均分是多少？`;
   c.options=options(c.answer,r);
   c.methods=[method('按人数份数合计',`取红 ${red} 人、蓝 ${blue} 人的一组作代表，共 ${total} 人。`,`两队分别得 ${red}×${low}=${red*low} 与 ${blue}×${high}=${blue*high} 分，总分 ${red*low+blue*high}。`,`每人平均 ${red*low+blue*high}÷${total}=${c.answer} 分。`),method('以低分作基准补上差额',`如果每人都得 ${low} 分，平均也是 ${low} 分。`,`蓝队每人多 ${high-low} 分，${blue} 份共多 ${blue*(high-low)} 分。`,`把差额平均到 ${total} 份，${low}+${F(blue*(high-low),total)}=${c.answer} 分。`)];
   const next=F(blue*low+red*high,total);
   c.extension={prompt:`把两队的人数比改为 ${blue}:${red}，每人得分保持不变。新的平均分是多少？`,answer:next,solution:`改变的是人数权重。红 ${blue} 份得 ${blue*low} 分，蓝 ${red} 份得 ${red*high} 分，共 ${total} 份。新平均 (${blue*low}+${red*high})÷${total}=${next} 分。`,kind:'condition-change',key:'swap-weights',math:{red:blue,blue:red,redScore:low,blueScore:high,den:1,total}};
   c.ruleHints=['两队人数不同，直接把两个分数平均合适吗？','用每个队的代表人数，把每人得分转成整队得分。'];
  }
  if(id==='overlapAverages'){
   const u=7+r(4),v=u+3+r(3),w=Math.floor((4*u+4*v-4)/7),x=4*u+4*v-7*w;
   const split=n=>{const q=Math.floor(n/3);return [q,q,n-2*q]};
   const values=[...split(4*u-x),x,...split(4*v-x)];
   c={...c,math:{values},answer:String(x),prompt:`7个数，前4个平均 ${u}，后4个平均 ${v}，全部平均 ${w}。第4个数是多少？`,options:options(String(x),r)};
   c.methods=[method('先还原总和再去重',`前4个合计 ${4*u}，后4个合计 ${4*v}，全部合计 ${7*w}。`,`两段相加时只有第4个出现两次；${4*u}+${4*v}−${7*w}=${x}。`),method('先找不重叠部分',`全部总和减后4个总和，前3个合计 ${7*w-4*v}。`,`前4个再减前3个，只剩第4个：${4*u}−${7*w-4*v}=${x}。`)];
   const z=[...values,values[0],values[6]],a=sum(z.slice(0,5)),b=sum(z.slice(4)),all=sum(z);
   c.extension={prompt:`另有9个数，前5个平均 ${F(a,5)}，后5个平均 ${F(b,5)}，全部平均 ${F(all,9)}。第5个数是多少？`,answer:String(z[4]),solution:`重叠位置改为第5个。先还原三种总和 ${a}、${b}、${all}，第5个=${a}+${b}−${all}=${z[4]}。`,kind:'condition-change',math:{values:z,groupSize:5}};
  }
  if(id==='fixedPerimeter'){
   const half=c.math.half,min=3,answer=min*(half-min);
   c.extension={prompt:`周长仍为 ${2*half}。两边都是至少 ${min} 的整数，改为求最小面积，是多少？`,answer:String(answer),solution:`长宽和 ${half}。合法短边从 ${min} 到 ${Math.floor(half/2)}；面积在两边靠近时增大，所以最小在最远的一对 ${min}、${half-min}，面积 ${answer}。`,math:{half,minSide:min,target:'minimum-area'},key:'minimum-with-lower-bound',kind:'condition-change'};
  }
  if(id==='boundaryNotch'){
   const {w,h,a,depth}=c.math,outer=2*(w+h),inner=2*(a+depth);
   c.extension={prompt:`把同样宽 ${a}、深 ${depth} 的长方形改为完全挖在纸片内部，不碰外边。外边界和洞口边界都计入，它们的总长度是多少？`,answer:String(outer+inner),solution:`外边界仍为 ${outer}，洞口新形成一整圈 ${a}+${depth}+${a}+${depth}=${inner}。没有原边被替换，所以合计 ${outer+inner}；不能沿用中间凹口只增加两条深度边的规则。`,math:{w,h,a,b:depth,placement:'internal',countInner:true},key:'internal-hole-count-both-boundaries',kind:'condition-change'};
  }
  if(id==='rule-packs-enough'){
   const p=c.math.params,possible=p.count%p.size===0,answer=possible?p.count/p.size*p.pack:0;
   const unit=c.math.context==='seedlings'?'棵树苗':'支画笔';
   c.extension={prompt:`需求仍为 ${p.count} ${unit}，现在只能买 ${p.size} ${unit}装的整包，每包 ${p.pack} 元，不能单买，而且必须恰好。若做不到填写0；能做到填写最少费用。`,answer:String(answer),solution:possible?`${p.count} 能被 ${p.size} 整除，买 ${p.count/p.size} 包恰好，费用 ${answer}。`:`整包只能组成 ${p.size} 的整数倍，${p.count} 不是这样的倍数；费用再便宜也没有合法方案，填写0。`,math:{variant:'packs-only-exact',context:c.math.context,params:copy(p)},key:'whole-pack-feasibility',kind:'condition-change'};
  }
  if(id==='rule-fraction-reverse'){
   // If the first use were one half, its amount would equal the remainder.
   // Build integral supplies backwards with unequal wholes in revision 3.
   const prior=c.math.params,k=prior.left/((prior.d1-1)*(prior.d2-1)),d1=3+r(2);
   c=rules.create('fraction-reverse',{d1,d2:prior.d2,left:(d1-1)*(prior.d2-1)*k},c.math.context,r);
   const p=c.math.params,start=p.left*p.d1*p.d2/((p.d1-1)*(p.d2-1)),first=start/p.d1,second=first/p.d2,left=start-first-second,unit=c.math.context==='supplies'?'张':'升';
   c.extension={prompt:`沿用原来的 ${start} ${unit}。第一次仍用掉原量的 1/${p.d1}，第二次改为用掉“第一次用掉的量”的 1/${p.d2}。最后剩多少${unit}？`,answer:String(left),solution:`第二次的整体是第一次用量 ${first}，不是余量。第二次用 ${first}÷${p.d2}=${second}；原量减两次用量，${start}−${first}−${second}=${left} ${unit}。`,math:{variant:'fraction-of-used',context:c.math.context,params:{d1:p.d1,d2:p.d2,start}},key:'second-fraction-of-first-use',kind:'condition-change'};
  }
  if(id==='quarterTurn'||id==='transformOrder'){
   const start=r(4),count=id==='quarterTurn'?1+2*r(4):1+2*r(2),names=['上','右','下','左'],mirror=v=>(4-v)%4;
   const answer=id==='quarterTurn'?(start+count)%4:mirror((start+count)%4),changed=id==='quarterTurn'?((start-count)%4+4)%4:(mirror(start)+count)%4;
   c={...c,math:id==='quarterTurn'?{start,turns:count}:{start,rot:count},answer:String(answer),options:options(String(answer),r)};
   c.prompt=id==='quarterTurn'?`箭头最初向${names[start]}，每次顺时针旋转90°，连续旋转 ${count} 次。最后向哪个方向？上填0，右填1，下填2，左填3。`:`箭头方向用上0、右1、下2、左3表示，最初是 ${start}。先顺时针转 ${count} 个90°，再沿竖直轴作镜像（左右交换，上下不变），最后方向填几？`;
   c.methods=[method('按指定次序追踪',`从 ${names[start]} 开始，顺时针转 ${count} 个90°，先到 ${names[(start+count)%4]}。`,id==='quarterTurn'?`到 ${names[answer]}，填 ${answer}。`:`接着作左右镜像，到 ${names[answer]}，填 ${answer}。`)];
   c.extension={prompt:id==='quarterTurn'?'改为逆时针旋转同样次数，填哪个数字？':'先镜像、再做相同旋转，最终方向填几？',answer:String(changed),solution:id==='quarterTurn'?`从相同起点逆向转 ${count} 次，最后 ${names[changed]}，填 ${changed}。方向相反时不能沿用原来的结果。`:`先镜像到 ${names[mirror(start)]}，再顺时针转 ${count} 次，到 ${names[changed]}，填 ${changed}。每一步都合法，次序改变了结果。`,math:id==='quarterTurn'?{start,turns:count,direction:'anticlockwise'}:{start,rot:count,order:'mirror-first'},key:'reverse-direction-or-order',kind:'condition-change'};
  }
  return c;
 }

 function units(groups,caption='',extra={}){return {kind:'scene-units',groups,caption,...extra}}
 function slots(values,caption='',extra={}){return {kind:'scene-slots',values,caption,...extra}}
 function flow(nodes,caption='',extra={}){return {kind:'scene-flow',nodes,caption,...extra}}
 function strips(rows,caption='',extra={}){return {kind:'scene-strips',rows,caption,...extra}}
 function circle(values,caption='',extra={}){return {kind:'scene-circle',values,caption,...extra}}
 function timeline(events,caption='',extra={}){return {kind:'scene-timeline',events,caption,...extra}}
 const group=(name,count,unit='份',score=null)=>({name,count,unit,score});
 const row=(label,parts,value='?')=>({label,parts,value});
 const items=(n,text='?')=>Array.from({length:n},()=>text);
 function scene(c,f,variation=false){
  const id=f.id,m=c.math,p=m.params||m,v=variation,E=c.extension;
  if(id.startsWith('rule-')){
   const math=v?E.math:m,k=math.variant,a=math.params,context=math.context;
   if(k.startsWith('join-'))return {kind:'scene-join',n:Number(a.n),piece:k==='join-piece'?'?':Number(a.piece),lap:Number(a.lap),closed:k==='join-closed',total:k==='join-piece'?Number(a.total):'?',caption:context==='panels'?'展示板接成长条':'软材料拼接；阴影是重叠部分'};
   if(k.startsWith('posts-'))return {kind:'scene-intervals',distance:Number(a.distance),gap:Number(a.gap),ends:k==='posts-both',caption:'圆点是标记，线段是间隔'};
   if(k.startsWith('weighted-'))return units([group('甲',Number(a.a),'人数份',k==='weighted-score'?'?':a.low),group('乙',Number(a.b),'人数份',a.high)],'用比例中的一组作代表；不是实际总人数',{average:k==='weighted-score'?a.mean:'?',object:'person'});
   if(k.startsWith('ratio-'))return {kind:'scene-ratioRectangle',a:Number(a.a),b:Number(a.b),perimeter:k==='ratio-length'?a.perimeter:'?',width:k==='ratio-perimeter'?a.width:'?',caption:'长与宽同一份；两条长、两条宽组成一周'};
   if(k.startsWith('fraction-'))return {kind:'scene-fractions',d1:Number(a.d1),d2:Number(a.d2),original:k==='fraction-original',secondOfUsed:k==='fraction-of-used',left:k==='fraction-reverse'?a.left:'?',start:['fraction-original','fraction-of-used'].includes(k)?a.start:'?',unit:context==='supplies'?'张':'升',caption:'第二次分数的整体用括号标出'};
   if(k.startsWith('packs-'))return {kind:'scene-purchase',size:Number(a.size),single:k==='packs-only-exact'?undefined:a.single,pack:a.pack,count:Number(a.count),enough:k==='packs-enough',object:context==='seedlings'?'棵树苗':'支画笔',caption:k==='packs-only-exact'?'只能买整包，必须恰好':k==='packs-enough'?'允许多买，包装完整':'必须恰好，包装完整'};
   throw Error('No rule scene '+k);
  }
  switch(id){
   case 'natural-weighted':case 'natural-fractionWeighted':{const a=v&&E.key==='swap-weights'?E.math:{...m,red:v?2*m.red:m.red};return units([group('红队',a.red,'人数份',F(a.redScore,a.den)),group('蓝队',a.blue,'人数份',F(a.blueScore,a.den))],'按比例取一组代表；每人分数见积分标记',{object:'person',average:'?'})}
   case 'fractionBackwards':return {kind:'scene-fractions',d1:2,d2:3,original:v,left:v?'?':m.left,start:'?',unit:'枚',caption:v?'两次都按最初总数':'第二次按第一天剩下的贴纸'};
   case 'fractionSharedRemainder':return flow([{label:'最初',value:'?'},{label:'取原量1/3',value:'−'},{label:'放回',value:m.add+' 个'},{label:v?'取原量3/8':'取现有3/8',value:'−'},{label:'最后',value:v?'?':(5*m.unit+5*m.add/8)+' 个'}],'两个分数是否对应同一整体？');
   case 'fractionDifferentWholes':return strips([row('甲盒：'+m.a+' 颗',4,v?'剩余3份':'取出1份'),row('乙盒：'+m.b+' 颗',3,v?'剩余2份':'取出1份')],'每条代表各自的整体；两条不是同一份大小',{selected:v?'remaining':'removed',separateWholes:true});
   case 'packPrice':return {kind:'scene-purchase',size:3,single:m.single,pack:m.pack,count:m.count,enough:v,object:'支笔',caption:v?'至少买够，允许多买':'必须恰好买足'};
   case 'mixedPacks':return {kind:'scene-purchase',packs:[{size:4,price:m.p},{size:6,price:m.q}],count:m.count,enough:v,object:'支笔',caption:'不能拆包；分别比较4支装与6支装'};
   case 'ratioEqualize':return strips([row('红',m.a),row('蓝',m.b)],v?'只从蓝取走 '+(m.b-m.a)*m.unit+' 个':'只向红加入 '+(m.b-m.a)*m.unit+' 个',{equalAfter:true,changeSide:v?'blue':'red'});
   case 'ratioTotal':return strips([row('红',m.a),row('蓝',m.b)],'两色原来合计 '+(m.a+m.b)*m.u+' 块'+(v?'；只加 '+(m.b-m.a)+' 块红色':''));
   case 'linkedRatios':return strips([row('红:蓝',m.a+m.b,`${m.a}:${m.b}`),row('蓝:绿',m.c+m.d,`${m.c}:${m.d}`)],'绿 '+m.b*m.d*m.u+' 块'+(v?'；只改变蓝色':'；两行蓝色为同一数量'),{linked:true});
   case 'transferBetweenBoxes':return strips([row('甲',m.a),row('乙',m.b)],v?`外部只向甲加入 ${m.moved} 块`:`从乙移 ${m.moved} 块给甲后相等`,{transfer:v?'external':'between',moved:m.moved});
   case 'balanceCancel':return {kind:'scene-balance',left:{boxes:v?m.a+1:m.a+1,weight:m.b},right:{boxes:v?m.a-1:m.a,weight:m.x+m.b},caption:v?'右边少一个盒子，需要补砝码':'相同盒子，同一副水平天平'};
   case 'tickets':return units([group('成人票',1,'种',m.adult),group('儿童票',1,'种',m.child)],`总价 ${m.adults*m.adult+(m.people-m.adults)*m.child} 元${v?'；不限总人数':`；共 ${m.people} 人`}`,{object:'ticket'});
   case 'twoCoins':return units([group('1元币','?','枚',1),group('2元币','?','枚',2)],`${v?'取走每种各1枚前：':''}共 ${m.n} 枚，${m.n+m.twos} 元`,{object:'coin'});
   case 'stampConstraint':return units([group('3元邮票','?','张',3),group('5元邮票','?','张',5)],`恰好 ${m.total} 元；${v?'允许一种不用':'每种至少一张'}`,{object:'stamp'});
   case 'repeatedMachine':return flow([{label:'输入',value:v?m.x:'?'},{label:'第1次',value:v?`(+${m.b})×${m.a}`:`×${m.a}+${m.b}`},{label:'第2次',value:v?`(+${m.b})×${m.a}`:`×${m.a}+${m.b}`},{label:'输出',value:v?'?':(m.x*m.a+m.b)*m.a+m.b}],'机器每次使用同一个规则');
   case 'machineOrder':return {kind:'scene-twoFlows',rows:[{name:'先甲后乙',nodes:[v?2*m.x:m.x,`×${m.a}+${m.b}`,`×${m.c}+${m.d}`,'?']},{name:'先乙后甲',nodes:[v?2*m.x:m.x,`×${m.c}+${m.d}`,`×${m.a}+${m.b}`,'?']}],caption:'同一个输入，两种顺序'};
   case 'machineMeeting':return {kind:'scene-twoFlows',rows:[{name:'甲',nodes:['?',`×${m.a}+${m.d+(v?1:0)}`,'同一输出']},{name:'乙',nodes:['?',`×${m.c}+${m.b}`,'同一输出']}],caption:'比较每增加1输入，两边输出怎样变化'};
   case 'linearTable':return v?flow([{label:'输入',value:m.target},{label:'先加',value:m.b},{label:'后乘',value:m.k},{label:'输出',value:'?'}],'沿用从原表发现的两个固定数'):{kind:'table',rows:[['输入',m.x,m.x+2,m.target],['输出',m.k*m.x+m.b,m.k*(m.x+2)+m.b,'?']]};
   case 'percentRoundTrip':return flow([{label:'原价',value:m.start+' 元'},{label:'上涨',value:m.percent+'%'},{label:v?'恢复原价':'下降',value:v?'? %':m.percent+'%'},{label:v?'目标价格':'便宜多少',value:v?m.start+' 元':'? 元'}],'每个百分比的括号都指向它前面的价格');
   case 'discountOrder':return flow([{label:'原价',value:m.price},{label:v?'先用券':'先折扣',value:v?'−'+m.q:'×'+(100-m.p)+'%'},{label:v?'后折扣':'后用券',value:v?'×'+(100-m.p)+'%':'−'+m.q},{label:'价格',value:'?'}],'操作顺序决定百分比的整体');
   case 'percentRestore':{const p=v&&m.p===100?50:m.p;return strips([row('原价',100,100),row(v?'先降后的价':'先涨后的价',v?100-p:100+p,v?100-p:100+p)],v?'从降低后的价格涨回100':'从提高后的价格降回100',{continuous:true})}
   case 'natural-offers':return {kind:'scene-twoFlows',rows:[{name:'甲店',nodes:[v?'? 本':m.count+' 本',m.price+' 元/本','×75%','+'+m.fee+' 配送']},{name:'乙店',nodes:[v?'? 本':m.count+' 本',m.price-1+' 元/本','免配送']}],caption:v?'求甲总价不高于乙的最少整数本数':'比较同样本数的整单费用'};
   case 'equalDistanceSpeed':return {kind:'scene-journey',segments:[{name:'去',speed:m.speed},{name:'回',speed:2*m.speed}],equal:v?'time':'distance',caption:v?'去回时间相同':'去回路程相同，时间未必相同'};
   case 'natural-catch':return {kind:'scene-journey',segments:[{name:'小乐',speed:m.slow},{name:'小明',speed:m.fast}],delay:m.delay,afterCatch:v,caption:v?`追上后小明停，小乐再走 ${m.delay} 分钟`:`小乐先走 ${m.delay} 分钟，小明再出发`};
   case 'riverTravel':return {kind:'scene-journey',segments:[{name:'顺流',speed:v?m.v:m.v+m.c},{name:'逆流',speed:v?m.v:m.v-m.c}],distance:m.distance,equal:'distance',caption:v?'取消水流':'静水 '+m.v+'，水流 '+m.c+' 千米/时'};
   case 'jointWork':return units([group('甲',1,'人',m.a),...(!v?[group('乙',1,'人',m.b)]:[])],`每分钟分别完成图中数量；目标 ${(m.a+m.b)*m.t} 个盒子`,{object:'person',scoreUnit:'个/分钟'});
   case 'unitConversion':return flow([{label:'总量',value:m.liters+' 升'},{label:'统一单位',value:'1升=1000毫升'},{label:'每杯',value:m.cup*(v?2:1)+' 毫升'},{label:'杯数',value:'?'}],'同一单位的容量相除');
   case 'stagedClimb':return {kind:'scene-climb',up:m.up,down:m.down,height:m.height,stop:!v,caption:v?'每个夜晚都完整回退':'白天到标记立即停，不再夜间回退'};
   case 'fixedPerimeter':return {kind:'scene-fixedPerimeter',half:m.half,even:v&&!E.math?.minSide,minSide:v?E.math?.minSide:null,caption:`周长 ${2*m.half}，${v&&E.math?.minSide?'每边至少 '+E.math.minSide:v?'两边为正偶数':'两边为正整数'}；${v&&E.math?.minSide?'求最小':'比较'}面积`};
   case 'overlapAverages':{const a=v?(E.math?.values||[...m.values,m.values[0],m.values[6]]):m.values,n=a.length,k=(n+1)/2;return {kind:'scene-overlapSequence',n,k,means:[F(sum(a.slice(0,k)),k),F(sum(a.slice(k-1)),k),F(sum(a),n)],caption:`第 ${k} 个位置同时属于前后两段；只给平均，不给各数`}}
   case 'missingAverage':return strips([row('原来 '+m.count+' 个',m.count,'平均 '+m.mean),row('余下 '+(m.count-1)+' 个',m.count-1,'平均 '+m.other),row(v?'再放回两次':'删去',v?2:1,'?')],v?'余下的数与两份删去数合并':'两条的总量差对应删去的数');
   case 'medianSort':{const a=[m.start+4*m.gap+(v?100:0),m.start,m.start+3*m.gap,m.start+m.gap,m.start+2*m.gap];return slots(a,'先比较大小，再确定中间位置',{positions:true})}
   case 'chartAverage':{const counts=m.counts.map((x,i)=>x+Number(v&&i===2));return {kind:'bars',values:counts,names:['2分','4分','6分']}}
   case 'cumulativeChart':return {kind:'scene-cumulative',values:[m.a,m.a+m.b,m.a+m.b+m.c,m.a+m.b+m.c+m.d],target:v?[3,4]:[1,3],caption:v?'恰好4分':'恰好2分或3分；每个累计包含前面的档'};
   case 'reverseDigits':return {kind:'scene-placeValue',rows:[{label:'原数',digits:v?['小','大']:['大','小']},{label:'交换',digits:v?['大','小']:['小','大']}],caption:v?`数字和 ${m.a+m.b}、差 ${m.a-m.b}`:`数字和 ${m.a+m.b}、交换后小 ${9*(m.a-m.b)}`};
   case 'digitInsert':return {kind:'scene-placeValue',rows:[{label:'位置1',digits:[m.d,m.a,m.b]},{label:'位置2',digits:[m.a,m.d,m.b]},{label:'位置3',digits:[m.a,m.b,m.d]}],caption:v?'比较同一组位置，取最小':'原来两张卡顺序保留；比较大小'};
   case 'numberAppend':return {kind:'scene-placeValue',rows:[{label:'原数',digits:['?','?']},{label:v?'前添':'末添',digits:v?[m.digit,'?','?']:['?','?',m.digit]}],caption:v?'前添的数字占百位':'新数比原数多 '+(9*m.n+m.digit)};
   case 'divisibleDigits':case 'divisibleEleven':return slots([m.a,'□',m.b??m.c,'□'],id==='divisibleDigits'?(v?'被9整除且为偶数':'同时被9和5整除'):(v?'数全部合法选择':'同时被11和5整除'),{positions:true});
   case 'natural-digitCount':case 'natural-distinctDigitCount':return {kind:'scene-choices',values:m.digits,places:2,repeat:v?!m.distinct:!m.distinct,caption:'十位与个位有序；数字和须被3整除'};
   case 'digitComplement':return slots(items(m.length,`0…9`),v?`恰好一位 ${m.digit}`:`至少一位 ${m.digit}`,{positions:true});
   case 'differentDigits':return slots([`1…${m.digits}`,`1…${m.digits}`],v?'两位不同；交换顺序合为同一个':'两位必须不同；顺序不同算不同',{positions:true,exchangeEquivalent:v});
   case 'digitDivisor':return slots([m.tens,v?'0…9':'1…9'],'个位作除数'+(v?'：0能作除数吗？':''),{positions:true});
   case 'pairedSum':return strips([row(v?'只取偶数':'连续整数',m.n,`1、2、…、${m.n}`),row('反向排列',m.n,`${m.n}、…、2、1`)],'对应位置配对',{pairing:true});
   case 'telescopingDifferences':return timeline([m.start+(v?m.step:0),...Array.from({length:m.n-(v?1:0)},(_,i)=>m.start+(v?m.step:0)+(i+1)*m.step)],'相邻端点作差后相加；每段 '+m.step);
   case 'neighborProducts':return {kind:'scene-product',n:m.n,delta:v?2:1,caption:'比较 n×n 与 (n−d)×(n+d)，方格只表示对应关系'};
   case 'signedProduct':return slots([-4*m.k,-3*m.k,-m.k,0,2*m.k,5*m.k],v?'任选2张，先比较符号':'任选3张，先比较符号',{positions:false,choose:v?2:3});
   case 'squareBounds':return {kind:'scene-squareBounds',n:m.n,upper:v,caption:'找相邻整数的平方夹住这个数；边界整数未知'};
   case 'consecutiveRepresentations':return strips([row('连续数',5,v?'a≥0':'a≥1')],`总和 ${m.total}；至少2项；首项、项数都未知`,{sequence:true});
   case 'recurrenceForward':case 'recurrenceTotal':case 'recurrenceBackwards':case 'recurrenceRemainders':{let a=m.a??m.first??(v?2:1),b=m.b??m.second??(v?2:1);if(v&&id==='recurrenceForward')[a,b]=[b,a];const seq=[a,b];while(seq.length<m.n)seq.push(seq.at(-1)+seq.at(-2));return slots(id==='recurrenceBackwards'?['?', '?','…',seq.at(-2),seq.at(-1)]:[a,b,'?','?','…'],`${m.n} 项；从第3项起前两项相加`+(v&&id==='recurrenceBackwards'?'；第1项增加1':v&&id==='recurrenceTotal'?'；只加第2项起':''),{positions:true})}
   case 'factorBalance':return {kind:'scene-factorPairs',product:m.product,caption:v?'合法因数对中比较最大和':'合法因数对中比较最小和'};
   case 'threeDivisors':return timeline([1,m.limit],v?'恰好3个因数：找最大合法数':'区间内检查恰好3个因数',{domain:'integer'});
   case 'divisorPowers':return {kind:'scene-exponentGrid',a:m.a,b:m.b,even:v,caption:v?'两个指数都须为偶数':'每个因数由两个指数唯一确定'};
   case 'equalBags':return units([group('红糖',m.a,'颗'),group('蓝糖',m.b,'颗')],v?'比较所有可行袋数':'两色全部用完；每袋两色数量分别相同',{object:'ball',compress:true});
   case 'bells':return {kind:'scene-twoTimelines',periods:[m.a,m.b],start:0,end:v?(m.a*m.b/((a,b)=>{while(b)[a,b]=[b,a%b];return a})(m.a,m.b)):m.duration,includeStart:v,caption:v?'起点和终点都计入':'不算起点，结束时刻计入'};
   case 'offsetBells':return {kind:'scene-twoTimelines',periods:[m.a,m.b],offsets:[0,m.offset],start:0,end:m.a*m.b+m.offset,caption:v?'下一次同时响':'第一次同时响在0之后'};
   case 'lastDigit':return flow([{label:'底数',value:m.base},{label:'指数',value:v?`${m.exponent} 与 ${m.exponent+1}`:m.exponent},{label:v?'相邻幂相加个位':'个位',value:'?'}],'寻找从一次方开始的个位循环');
   case 'cyclicPosition':return circle(Array.from({length:m.size},(_,i)=>i+1),`从 ${m.start} 开始，${v?'逆':'顺'}时针 ${m.steps} 步`,{start:m.start,direction:v?-1:1});
   case 'repeatedOnes':return slots(['1','1','…','1'],`${v?m.n+1:m.n} 个1；除以7取余`,{positions:true});
   case 'menuBranches':return {kind:'scene-branch',branches:[{label:'米饭',count:m.rice,next:{label:'菜',count:m.dish}},{label:'面',count:m.noodle}],drinks:v?3:null,caption:v?'每份午餐都再配3选1饮料':'米饭配菜，或单独一份面'};
   case 'adjacentLine':return slots(['乐','明',...items(m.n-2,'人')],v?'两人不能相邻':'两人必须相邻；其余人各不相同',{positions:true,adjacent:!v});
   case 'restrictedTeam':return units([group('小乐',1,'人'),group('小明',1,'人'),group('其他',m.n-2,'人')],v?'小乐小明都必须入选，第3人待选':'选3人，无职位；乐明不能同选',{object:'person'});
   case 'unorderedPairs':return units([group('不同小朋友',m.n,'人')],v?'每对搭档指定角色':'选2人作搭档，不分先后',{object:'person'});
   case 'circularSeating':return circle(items(m.n,'人'),v?'取消相邻限制；旋转合并':'乐明相邻；旋转合并，镜像不合并',{special:['乐','明'],adjacent:!v});
   case 'parityPermutations':return slots(Array.from({length:m.n},(_,i)=>i+1),v?'奇数彼此不能相邻':'偶数彼此不能相邻',{positions:true});
   case 'binaryNoNeighbors':return slots([v?'●':'○/●',...items(m.n-1,'○/●')],v?'第一盏必须亮；亮灯不能相邻':'每盏亮或灭；亮灯不能相邻',{positions:true});
   case 'allThreeColors':return slots(items(m.n,'红/蓝/绿'),v?'三色中恰好出现两种':'三种颜色都必须出现',{positions:true});
   case 'spinnerLabels':return circle([...items(m.a,'A'),...items(m.b,'B'),...items(m.c,'C')],v?'已知不是C，只在A/B扇区比较':'每个扇区等面积、等机会',{sectors:true,excluded:v?['C']:[]});
   case 'natural-pairChance':case 'conditionalBalls':return units([group('红',m.red,'个'),group('蓝',m.blue,'个')],id==='natural-pairChance'?(v?'每次放回并混合':'不放回取2个，具体球对等可能'):(v?'已知两球颜色相同':'已知至少一个红球'),{object:'ball',sample:2});
   case 'diceSum':return {kind:'scene-diceGrid',faces:m.faces,target:m.target,different:v,caption:v?'只保留两个点数不同的有序对':'行列各对应一枚骰子的实际点数'};
   case 'remainderProbability':return {kind:'scene-remainderCards',mod:m.mod,count:m.count,wanted:m.wanted,includeZero:v,caption:'每张卡等可能；先看完整循环，再看尾段'};
   case 'worstCaseColors':return units(m.caps.map((n,i)=>group(['红','蓝','绿'][i],n,'个')),`不放回；保证 ${m.k+Number(v)} 个同色`,{object:'ball',guarantee:m.k+Number(v)});
   case 'setOutside':case 'exactlyOneSet':case 'natural-unionChance':case 'natural-complementChance':case 'ratioUnion':{const a=m.a??m.red,b=m.b??m.blue;return {kind:'scene-sets',a:id==='ratioUnion'?m.a+' 份':a,b:id==='ratioUnion'?m.b+' 份':b,both:m.both,total:m.total??(id==='ratioUnion'?(m.a+m.b)*m.unit-m.both:null),change:v&&['exactlyOneSet','ratioUnion'].includes(id)?'one-joins-second':v&&id==='setOutside'?'one-outside-joins-both':null,conditional:v&&id.startsWith('natural-'),caption:v?E.prompt:'两组交叠区域属于两组；圈外属于都没参加'}};
   case 'threeSetExactlyTwo':return {kind:'scene-threeSets',ab:m.ab,ac:m.ac,bc:m.bc,triple:m.triple,caption:v?'至少两组：中央三组区域也符合':'恰好两组：每个两组交集都包含中央三组交集'};
   case 'lightSwitchParity':return flow([{label:'开始',value:m.on?'亮':'灭'},{label:'重复按',value:`${m.groups}×${m.per}`},{label:'再按',value:m.extra+(v?1:0)},{label:'最后',value:'?'}],'每次在亮灭之间切换');
   case 'ballReplacement':return {kind:'scene-ballRule',white:m.white+Number(v),black:m.black,caption:'同色→黑；异色→白；每次少一球'};
   case 'quarterTurn':case 'transformOrder':return {kind:'scene-direction',start:m.start,turns:id==='quarterTurn'?m.turns:m.rot,mirror:id==='transformOrder',reverseOrder:v&&id==='transformOrder',anticlockwise:v&&id==='quarterTurn',caption:'上0、右1、下2、左3；按条件顺序追踪'};
   case 'cubeSteps':return {kind:'scene-stairs',n:m.n,depth:v?2:1,caption:`每列 ${v?2:1} 块厚；列高1到 ${m.n}`};
   case 'natural-tiles':{const scale=v?2:1;return {kind:'scene-tiledRectangle',w:m.w*scale,h:m.h*scale,caption:'同规格正方形砖铺满，不切砖；先找最大整数边长'}};
   case 'mapScale':return strips([row('甲地图',m.a,m.a+'厘米'),row('乙地图',m.a*m.k*(v?.5:1),'?')],v?'乙再缩成当前1/2':'乙所有长度为甲的 '+m.k+' 倍',{continuous:true});
   case 'scaleAreaReverse':return flow([{label:'原面积',value:'?'},{label:'长放大',value:m.k+' 倍'},...(v?[]:[{label:'长缩为当前',value:'1/'+m.s}]),{label:'面积',value:v?'?':m.old*m.k*m.k/(m.s*m.s)}],'长度倍率与面积倍率分别追踪');
   case 'oppositeScale':return strips([row('原长',m.a,m.a+'份'),row('新长',m.b,m.b+'份'),row('原宽',m.b,m.old),row('新宽',v?m.b*m.b/m.a:m.a,'?')],v?'长宽使用同一倍率，面积不再固定':'面积不变：宽须使用反向倍率',{continuous:true});
   case 'similarAreaPerimeter':return strips([row('小面积',m.a*m.a,m.a*m.a+'份'),row('大面积',m.b*m.b,m.b*m.b+'份')],v?`新图周长为小图 ${m.b} 倍，求面积倍率`:`小图周长 ${m.a*m.unit}；先把面积比还原成长度比`,{continuous:true});
   case 'shadowSimilarity':return {kind:'scene-shadows',smallHeight:m.a,smallShadow:v?'?':2*m.a,bigShadow:v?m.b*m.unit:2*m.b*m.unit,bigHeight:'?',caption:v?'同一时刻两杆，影长同倍率缩短':'同一时刻、竖直杆、同一阳光方向'};
   case 'ageDifference':return {kind:'scene-age',ago:m.ago,gap:m.parent-m.child,child:v?m.child:'?',parent:v?m.parent:'?',caption:v?'年龄差不变，找未来2倍时刻':`${m.ago} 年前大人是孩子3倍；求孩子现在年龄`};
   default:return geometry(c,f,v);
  }
 }

 function geometry(c,f,v){
  const m=c.math,id=f.id,E=c.extension,d=copy(c.diagram||{});
  if(!v&&d.kind&&!['table','rule-table','line','digits','cuboid','coordinate','sets','meeting','garden','balls','rectangle'].includes(d.kind))return d;
  switch(id){
   case 'natural-coordinateDistance':return {kind:'scene-coordinates',a:[m.x,m.y],b:[m.x+m.dx,m.y+m.dy],gridOnly:v,caption:v?'只允许水平和竖直走':'比较直线与网格距离'};
   case 'coordinateHorizontal':return {kind:'scene-coordinates',a:[m.a+(v?5:0),m.y],b:[m.b+(v?5:0),m.y],caption:'两点同一纵坐标'};
   case 'paintedCube':case 'cubeProbability':return {kind:'scene-cube',n:m.n,faces:v&&id==='paintedCube'?['top','bottom']:['all'],conditional:v&&id==='cubeProbability',caption:v?configs[id].change:'棱上每边 '+m.n+' 个小块；角另分一类'};
   case 'ladderShift':return {kind:'scene-ladder',length:5*m.k,base:v?'?':3*m.k,nextBase:v?null:4*m.k,height:v?4*m.k:'?',caption:v?'已知高度，求底端距离':'同一根梯子；斜边长度不变'};
   case 'boundaryNotch':return v?(E.math?.placement==='internal'?{kind:'scene-holeRectangle',...E.math,caption:'外边与内洞都计入边界总长度'}:{kind:'lShape',w:m.w,h:m.h,a:m.a,b:m.depth,caption:'缺口在角上；比较移除与补入的边'}):{kind:'notch',...m,caption:'中间缺口；口宽与深度作用不同'};
   case 'rectangleDiagonalArea':return {kind:'rectangleDiagonal',w:m.w*(v?1.5:1),h:m.h};
   case 'lShapeArea':return v?{kind:'scene-holeRectangle',...m,caption:'洞在内部；面积与轮廓变化分开'}:{kind:'lShape',...m};
   case 'crossArea':return {kind:'cross',...m,intersectionOnly:v};
   case 'semicircleBoundary':return v?{kind:'scene-fullCircle',radius:m.radius,caption:'两条直径拼到内部，不属于外周'}:{kind:'semicircle',...m};
   case 'circleRingRatio':return {kind:'ring',r1:m.r1*(v?2:1),r2:m.r2*(v?2:1)};
   case 'parallelTriangle':return {kind:'parallelTriangle',n:v?2:m.n,k:v?1:m.k};
   case 'hypotenuseMidpoint':return {kind:'hypotenuseMidpoint',...m,legMidpoint:v};
   case 'openBox':return {kind:'boxNet',side:m.side,cut:v?1:null,caption:v?'固定每角剪1×1，求底面积':'x未知；底边必须为正'};
   case 'circleRoute':return {kind:'circleRoute',...m,whole:v};
   case 'outsideAngle':return {kind:'isoscelesExterior',...m,target:v?'other-base':'exterior'};
   case 'natural-angleRatio':return v?{kind:'scene-polygonAngles',ratios:[...m.ratios,m.ratios[2]],sides:4,caption:'四边形角总量360°'}:{kind:'angleRatioTriangle',ratios:m.ratios};
   case 'angleMarks':return {kind:'scene-rays',marks:m.marks,steps:m.step,other:v,caption:v?'沿另一个方向围出的角':'沿较短方向相隔 '+m.step+' 段'};
   case 'polygonTurn':return {kind:'scene-polygon',n:m.n,steps:v?Math.floor(m.n/2):m.n,caption:'沿边行走，外转角在顶点标出'};
   case 'overlapSquares':case 'overlapProbability':return {kind:'overlapSquares',...m,exclusive:v&&id==='overlapSquares',sampleFirst:v&&id==='overlapProbability'};
   case 'gridDetour':case 'routeProbability':case 'stepwiseRoute':return {kind:'routes',...m,firstUp:v&&id!=='stepwiseRoute',sampling:id==='stepwiseRoute'?!v:false};
   case 'rectanglePointAreas':return {kind:'fourAreas',top:m.top,left:m.left+(v?1:0),right:v?'?':m.right,bottom:'?',caption:v?'P只向右；左右总面积保持不变':'各三角形面积按标签给出，不按图估算'};
   case 'squareBorder':return {kind:'scene-border',n:m.n,partial:v,caption:v?'只加左、上；外角不重复':'外侧加一圈，原有格子不算新增'};
   case 'checkerDomino':return {kind:'checker',...m,removeTop:v};
   case 'foldHoles':return {kind:'foldHoles',interior:m.interior+Number(v),edge:m.edge-Number(v),center:m.center};
   case 'chartScale':return {kind:'bars',values:[m.a+Number(v),m.b+Number(v),m.c+Number(v)],names:['甲','乙','丙'],known:v?null:0,knownValue:m.a*m.unit,unit:v?m.unit:null};
   case 'truncatedBars':return {kind:'truncatedBars',...m,caption:v?'求乙比甲多的人数，刻度起点仍相同':'求两组实际总人数'};
   case 'rotatingColors':return {kind:'necklaceBlank',...m,fixed:v};
   default:throw Error('Missing explicit RC67 representation '+id);
  }
 }

 function decorate(c,f,generatorRevision){
  const config=configs[f.id];if(!config)throw Error('Missing family contract '+f.id);
  if(generatorRevision===3){
   const unambiguous=text=>String(text).replace(/÷\s*([-−]?\d+(?:\.\d+)?\/[-−]?\d+(?:\.\d+)?)/g,'÷ ($1)');
   c={...c,methods:c.methods.map(m=>({...m,steps:m.steps.map(unambiguous)})),extension:{...c.extension,solution:unambiguous(c.extension.solution)}};
  }
  const initial=scene(c,f),variation=scene(c,f,true),loads=load(c,f);
  const original=copy(c.math);
  if(!variations[f.id])throw Error('Missing variation value contract '+f.id);
  const variationSpec=generatorRevision===3?variations[f.id]:{category:'legacy-condition',recheck:config.change};
  const contract={schemaVersion:1,familyId:f.id,modelId:config.model,requiredTopics:[...f.topicIds],goal:config.goal,question:c.prompt,givens:original,constraints:config.constraints,criticalDecision:f.insight,reasoningKey:f.reasoningKey,configurationKey:f.structureKey||f.id,...loads,parameterPolicy:{domain:config.constraints,bounded:true,maxTrials:120,ordinaryScore:'integer',fractionReason:'fraction, ratio, probability, measurement or weighted result'},diagramSpec:{kind:initial.kind,source:'competition.math',stages:['initial','hint','solution','variation'],representationReason:config.model},variationSpec:{change:c.extension.prompt,category:variationSpec.category,decision:variationSpec.recheck,preserved:'未声明变化的原条件',independent:true,newStrategyClaim:false},validation:{oracle:'source/competition_reviewed_oracles.js + RC67 independent overrides',seeds:128}};
  c={...c,...loads,quality:contract,diagram:initial,displayRevision:1};
  c.ruleHints=c.ruleHints||[f.insight,hintPolicy[config.model]];
  if(!c.ruleHints.every(Boolean))throw Error('Missing hint policy '+f.id);
  c.quality.hintStages=c.ruleHints.map((text,i)=>({level:i+1,text,representation:initial.kind}));
  c.hintDiagram={...copy(initial),stage:{kind:'hint',text:c.ruleHints[1]}};
  c.methods=c.methods.map((method,route)=>({...method,frames:method.steps.map((text,step)=>({kind:'scene-stage',scene:solutionScene(c,f,route,step,initial),stage:{kind:'solution',route,step,text},routeDiagram:method.frames?.[step]||null}))}));
  const solvedVariation=copy(variation);
  if(solvedVariation.average==='?')solvedVariation.average=c.extension.answer;
  if(solvedVariation.kind==='scene-fractions'){if(solvedVariation.start==='?'&&solvedVariation.left!=='?')solvedVariation.start=c.extension.answer;else if(solvedVariation.left==='?')solvedVariation.left=c.extension.answer}
  const extension={...c.extension,diagram:variation,solutionFrames:[{kind:'scene-stage',scene:solvedVariation,stage:{kind:'solution',step:0,text:c.extension.solution}}]};
  if(generatorRevision===3){
   extension.math=extension.math||{...original,baseFamily:f.id,condition:config.change};
   // Adding a diagram or explicit provenance must not create a new first chance.
   // Only a genuinely changed target/condition supplies a new key in revise().
  }
  c.extension=extension;return c;
 }
 function solutionScene(c,f,route,step,initial){
  const m=c.math;
  if(['natural-weighted','natural-fractionWeighted'].includes(f.id)&&m.den===1){
   const a=m.red,b=m.blue,low=m.redScore,high=m.blueScore,total=a+b,answer=c.answer;
   if(!route&&step===0)return copy(initial);
   if(!route&&step===1)return units([group('红队合计',a,'人数份',a*low),group('蓝队合计',b,'人数份',b*high)],'先分别合计，不把总分当每人分数',{object:'person',scoreLabel:'整队共'});
   if(route&&step===0)return units([group('红队',a,'人数份',low),group('蓝队',b,'人数份',low)],'假设每人先拿同样的低分',{object:'person'});
   if(route&&step===1)return units([group('红队额外',a,'人数份',0),group('蓝队额外',b,'人数份',high-low)],'只有蓝队高出基准；这部分要分给全体',{object:'person'});
   return {kind:'scene-share',people:total,average:answer,totalScore:a*low+b*high,base:route?low:null,extraAverage:route?F(b*(high-low),total):null,caption:route?'先均分额外分数，再加每人的基准分':'总分平均分到代表组的每个人'};
  }
  if(f.id==='overlapAverages'){
   const d=copy(initial),values=m.values,k=4;d.totals=[sum(values.slice(0,k)),sum(values.slice(k-1)),sum(values)];d.knownMiddle=step===c.methods[route].steps.length-1?values[k-1]:null;d.caption=route?'用整体减后段，找到前面不重叠的部分':'从两段合计中扣去整段，留下重叠位置';return d;
  }
  if(f.id==='fixedPerimeter'){
   const half=m.half,short=Math.floor(half/2),rows=[];
   if(!route&&step===1){for(let x=1;x<=short;x++)rows.push({w:x,h:half-x,area:x*(half-x)});return {kind:'scene-areaPairs',rows,caption:'合法短边逐个列出，交换长宽不新增面积'}};
   if(route&&step<2){const w=Math.max(1,short-2),h=half-w;return {kind:'scene-areaPairs',rows:[{w,h,area:w*h},{w:w+1,h:h-1,area:(w+1)*(h-1)}],caption:'长减1、短加1：长宽和不变，比较增加与去掉的条'}};
   if(step===c.methods[route].steps.length-1)return {kind:'scene-areaPairs',rows:[{w:short,h:half-short,area:short*(half-short)}],caption:'最接近的一对达到最大面积'};
  }
  return copy(initial);
 }
 function family(f){const config=configs[f.id];if(!config)throw Error('Unregistered RC67 family '+f.id);const sameWeights=['natural-weighted','natural-fractionWeighted','rule-weighted-mean','rule-weighted-score'];return {...f,modelId:config.model,criticalDecision:f.insight,qualityPolicy:config,selectionReasoningKey:sameWeights.includes(f.id)?'weighted-total':f.reasoningKey}}
 function comfort(c){const a=c.calculationLoad||load(c,{id:c.family,level:c.level||1,insight:c.insight||''}).calculationLoad,b=c.readingLoad;return a.level*10+a.operations+Math.min(a.enumeration,50)/10+Number(a.fractional)+a.digits/10+(b?.level||1)*2}
 function familyLoads(f){return f.selectionLoads||(f.selectionLoads=load(revise(f.build(1,2),f,1),f))}
 return {configs,family,revise,decorate,scene,load,comfort,familyLoads};
})(typeof module!=='undefined'?require('./competition'):{competitionRng,competitionFraction,competitionNumericOptions},typeof module!=='undefined'?require('./competition_rules'):CompetitionRules);
if(typeof module!=='undefined')module.exports=CompetitionDesign;

'use strict';
// Engine 3 is an editorial layer. Engine 1/2 stay unchanged for record replay.
const {COMPETITION_REVIEWED,competitionReviewedEligible,competitionReviewedCreate,competitionReviewedRecipe}=((base,extra,helpers,fresh,rules,design)=>{
 const {competitionCanonicalIds,competitionHash,competitionFraction:F,competitionRatioText}=helpers;
 const revision=93;
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
   c.methods[0].steps[0]=`涨后 ${start}×${competitionRatioText(100+percent,100)}=${competitionRatioText(start*(100+percent),100)} 元。`;
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
 for(const f of COMPETITION_REVIEWED){f.reasoningKey=f.reasoningKey||rules.reasoningKey(f.id)||f.strategy;Object.assign(f,design.family(f))}
 function competitionReviewedEligible(ids){const scope=new Set(competitionCanonicalIds(ids));return COMPETITION_REVIEWED.filter(f=>f.topicIds.every(id=>scope.has(id)))}
 function competitionReviewedCreate(recipe){
  const f=COMPETITION_REVIEWED.find(f=>f.id===recipe?.familyId),seed=recipe?.seed;
  const generatorRevision=recipe?.generatorRevision===undefined?1:recipe.generatorRevision;
  if(recipe?.engine!==3||!f||![1,2,3].includes(generatorRevision)||!Number.isInteger(seed)||seed<1||seed>2147483647)throw Error('Invalid reviewed competition recipe');
  let c=rules.decorate(f.build(seed,generatorRevision===3?2:generatorRevision),f.id);
  if(generatorRevision===3)c=design.revise(c,f,seed);
  c=design.decorate(c,f,generatorRevision);
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
  const restoredRecipe={engine:3,familyId:f.id,seed};if(recipe.generatorRevision!==undefined)restoredRecipe.generatorRevision=generatorRevision;
  return {id,contentVersion:revision,skillId:ids[0]+'.01',phase:'挑战',mode:'competition',prompt:c.prompt,options:c.options,optionIds:c.options.map(v=>id+':'+v),answer:c.options.indexOf(c.answer),competition:{...c,reasoningKey:f.reasoningKey,hints:c.ruleHints||[f.insight],level:f.level,levelReason:f.levelReason,insight:f.insight,benchmarks:f.benchmarks,benchmarkKind:f.benchmarkKind,extension,signature,topicIds:ids,recipe:restoredRecipe}};
 }
 function competitionReviewedRecipe(familyId,seed){return {engine:3,familyId,seed,generatorRevision:3}}
 return {COMPETITION_REVIEWED,competitionReviewedEligible,competitionReviewedCreate,competitionReviewedRecipe};
})(typeof module!=='undefined'?require('./competition_catalog'):{COMPETITION_CATALOG,competitionCreate:competitionCatalogCreate},typeof module!=='undefined'?require('./competition_expansion'):{COMPETITION_EXPANSION},typeof module!=='undefined'?require('./competition'):{competitionCanonicalIds,competitionHash,competitionFraction,competitionRatioText},typeof module!=='undefined'?require('./competition_fresh'):{COMPETITION_FRESH},typeof module!=='undefined'?require('./competition_rules'):CompetitionRules,typeof module!=='undefined'?require('./competition_design'):CompetitionDesign);
if(typeof module!=='undefined')module.exports={COMPETITION_REVIEWED,competitionReviewedEligible,competitionCreate:competitionReviewedCreate,competitionReviewedRecipe};

'use strict';
// Mathematical aliases are reviewed explicitly. Strategy names and coincident
// answers never identify the same problem. Raw task signatures stay unchanged.
const CompetitionIdentity=((create)=>{
 const cache=new WeakMap();
 const integer=v=>{const n=Number(v);if(!Number.isSafeInteger(n))throw Error('Unsafe identity quantity');return n};
 function fraction(variant,params,domain){
  const p={d1:integer(params.d1),d2:integer(params.d2)};
  p[variant==='fraction-reverse'?'left':'start']=integer(params[variant==='fraction-reverse'?'left':'start']);
  return 'math-v1:'+JSON.stringify({model:'fraction-wholes',domain,variant,params:p});
 }
 function purchase(variant,params){
  const p={};for(const key of ['size','single','pack','count'])p[key]=integer(params[key]);
  return 'math-v1:'+JSON.stringify({model:'finite-purchase',domain:'count-items/yuan',variant,params:p});
 }
 function semantic(family,math,kind='main',context=null){
  if(family==='fractionBackwards')return fraction(kind==='main'?'fraction-reverse':'fraction-original',{d1:2,d2:3,left:math.left,start:3*integer(math.left)},'count-items');
  if(family==='packPrice')return purchase(kind==='main'?'packs-exact':'packs-enough',{...math,size:3});
  const variant=math.variant,p=math.params;
  if(family.startsWith('rule-')&&p){
   if(['packs-exact','packs-enough'].includes(variant))return purchase(variant,p);
   if(['fraction-reverse','fraction-original'].includes(variant)){
    const domain=context==='supplies'?'count-items':context==='water'?'volume-litre':math.quantityDomain;
    if(domain)return fraction(variant,p,domain);
   }
  }
  return null;
 }
 function key(task,kind='main'){
  const c=task.competition,m=kind==='main'?c.math:c.extension.math;
  try{return semantic(c.family,m||c.math,kind,m?.context)||'signature:'+(kind==='main'?c.signature:c.extension.signature)}catch{return 'signature:'+(kind==='main'?c.signature:c.extension.signature)}
 }
 function signatureKey(signature){
  try{const s=JSON.parse(signature);if(s.family&&s.math)return semantic(s.family,s.math)||'signature:'+signature}catch{}
  return 'signature:'+signature;
 }
 function uncertainKeys(signature){
  // RC65 omitted both unit domain and recipe on help-only new-rule views.
  // Keep that uncertainty; block an unsupported fresh first opportunity without
  // asserting which domain was actually seen or merging their solved counts.
  try{const s=JSON.parse(signature),m=s.math;if(s.family?.startsWith('rule-fraction-')&&m?.params&&!m.quantityDomain)return ['count-items','volume-litre'].map(d=>fraction(m.variant,m.params,d))}catch{}
  return [];
 }
 const earlier=(a,b)=>a.at-b.at||(a.order||0)-(b.order||0)||(a.correct===true?1:0)-(b.correct===true?1:0);
 function index(state){
  const cached=cache.get(state);if(cached&&cached.attempts===state.attempts&&cached.extensions===state.extensions&&cached.views===state.views&&cached.extensionViews===state.extensionViews&&cached.sequence===state.sequence&&cached.attemptCount===(state.attempts||[]).length&&cached.extensionCount===(state.extensions||[]).length&&cached.viewCount===Object.keys(state.views||{}).length)return cached.groups;
  const groups=new Map(),tasks=new Map(),add=(k)=>{if(!groups.has(k))groups.set(k,{key:k,attempted:false,hinted:false,solutionViewed:false,first:null,unknown:[],solvedMain:false,solvedExtension:false,firstCandidates:[]});return groups.get(k)};
  function task(recipe,signature,kind){
   if(!recipe)return null;const rk=JSON.stringify(recipe),t=tasks.has(rk)?tasks.get(rk):(()=>{try{return create(recipe)}catch{return null}})();tasks.set(rk,t);
   return t&&(kind==='main'?t.competition.signature:t.competition.extension.signature)===signature?t:null;
  }
  function first(g,s){g.firstCandidates.push(s);if(!g.first||earlier(s,g.first)<0)g.first=s}
  function mainSnapshot(t,s){
   if(!s||!Number.isFinite(s.at)||s.at<=0||!Number.isInteger(s.choice)||s.choice<0||s.choice>=5)return null;
   return {...s,kind:'main',signature:t.competition.signature,recipe:t.competition.recipe,correct:s.choice===t.answer,independent:s.independent!==false};
  }
  for(const h of Object.values(state.views||{})){
   const t=task(h.recipe,h.signature,'main')||task(h.first?.recipe,h.signature,'main')||task(h.last?.recipe,h.signature,'main')||task(h.solved?.recipe,h.signature,'main')||task((state.attempts||[]).find(a=>a.signature===h.signature)?.recipe,h.signature,'main');
   if(!t&&(h.attempted||h.hinted||h.solutionViewed))for(const possible of uncertainKeys(h.signature)){const g=add(possible);g.uncertain=true;g.unknown.push({at:h.at,order:0})}
   const g=add(t?key(t):signatureKey(h.signature));g.hinted||=h.hinted===true;g.solutionViewed||=h.solutionViewed===true;g.attempted||=h.attempted===true;
   const f=t?mainSnapshot(t,h.first):null,solved=t?mainSnapshot(t,h.solved):null;
   if(f){first(g,f);g.attempted=true}
   if(solved?.correct||f?.correct){g.solvedMain=true;g.solutionViewed=true}
   if(!f&&(h.attempted||h.hinted||h.solutionViewed))g.unknown.push({at:h.hintedAt||h.at,order:h.hintOrder||0,attempted:h.attempted===true,helped:h.hinted===true||h.solutionViewed===true});
  }
  for(const a of state.attempts||[]){
   const t=task(a.recipe,a.signature,'main'),s=t?mainSnapshot(t,a):null;if(!s)continue;
   const g=add(key(t));g.attempted=true;g.hinted||=a.hinted===true;g.solutionViewed||=a.priorSolutionViewed===true||s.correct;g.solvedMain||=s.correct;
   if(a.firstAttempt===true||a.firstCorrect===true)first(g,s);
  }
  for(const h of Object.values(state.extensionViews||{})){
   const t=task(h.recipe,h.signature,'extension')||task(h.solved?.recipe,h.signature,'extension'),g=add(t?key(t,'extension'):'signature:'+h.signature);g.attempted||=h.attempted===true;
   if(t&&typeof h.firstInput==='string'){
    const correct=valueEqual(h.firstInput,t.competition.extension.answer);
    first(g,{kind:'extension',recipe:t.competition.recipe,signature:h.signature,at:h.at,order:h.order||0,correct,independent:h.firstIndependent!==false,hinted:h.hinted===true,priorSolutionViewed:h.priorSolutionViewed===true,input:h.firstInput});
    g.solvedExtension||=correct;g.solutionViewed||=correct;
   }else if(h.attempted)g.unknown.push({at:h.at,attempted:true});
   if(t&&h.solved&&valueEqual(h.solved.input,t.competition.extension.answer)){g.solvedExtension=true;g.solutionViewed=true}
  }
  for(const a of state.extensions||[]){
   const t=task(a.recipe,a.variationSignature,'extension');if(!t||typeof a.input!=='string')continue;
   const g=add(key(t,'extension')),correct=valueEqual(a.input,t.competition.extension.answer);g.attempted=true;g.solvedExtension||=correct;g.solutionViewed||=correct;
   if(a.firstAttempt===true)first(g,{...a,kind:'extension',correct,independent:true});
  }
  for(const g of groups.values())g.cleanFirst=!!g.first&&g.first.correct&&g.first.independent!==false&&!g.first.hinted&&!g.first.priorSolutionViewed&&!g.unknown.some(u=>!Number.isFinite(u.at)||earlier(u,g.first)<=0);
  cache.set(state,{groups,attempts:state.attempts,extensions:state.extensions,views:state.views,extensionViews:state.extensionViews,sequence:state.sequence,attemptCount:(state.attempts||[]).length,extensionCount:(state.extensions||[]).length,viewCount:Object.keys(state.views||{}).length});return groups;
 }
 function valueEqual(a,b){const n=s=>{const p=String(s).trim().split('/').map(Number);return p.length===1?p[0]:p.length===2&&p[1]!==0?p[0]/p[1]:NaN};return Number.isFinite(n(a))&&Math.abs(n(a)-n(b))<1e-10}
 function exposure(state,task,kind='main'){return index(state).get(key(task,kind))||{attempted:false,hinted:false,solutionViewed:false,first:null,cleanFirst:false}}
 function counts(state){const g=[...index(state).values()];return {solved:g.filter(x=>x.solvedMain).length,first:g.filter(x=>x.solvedMain&&x.first?.kind==='main'&&x.cleanFirst).length,extensions:g.filter(x=>x.solvedExtension).length}}
 return {key,signatureKey,index,exposure,counts,invalidate:state=>cache.delete(state)};
})(typeof module!=='undefined'?require('./competition').competitionCreate:competitionCreate);
if(typeof module!=='undefined')module.exports=CompetitionIdentity;

'use strict';
const {competitionAdaptiveProfile,competitionAdaptiveTarget}=((catalog,create,valueEqual,identity)=>{
 const byId=new Map(catalog.map(f=>[f.id,f]));
 function competitionAdaptiveProfile(records,extensionRecords,topicIds,extensionViews={},mainViews={}){
  const scope=new Set(topicIds),events=[],seen=new Set(),variations=new Map(),state={attempts:records,extensions:extensionRecords,views:mainViews,extensionViews};
  for(const h of Object.values(extensionViews||{})){
   if(!h.attempted||typeof h.firstInput!=='string')continue;
   try{const t=create(h.recipe);if(h.signature===t.competition.extension.signature&&h.mainSignature===t.competition.signature){const g=identity.exposure(state,t,'extension');variations.set(h.mainSignature,g.first?.kind==='extension'&&g.cleanFirst)}}catch{}
  }
  // Retrying a variation is useful practice but never an independent first try.
  for(const a of extensionRecords||[]){
   if(a.firstAttempt!==true||variations.has(a.signature))continue;
   try{const t=create(a.recipe);if(t.competition.signature===a.signature&&a.variationSignature===t.competition.extension.signature){const g=typeof a.input==='string'?identity.exposure(state,t,'extension'):null;variations.set(a.signature,g?g.first?.kind==='extension'&&g.cleanFirst:a.correct===true)}}catch{}
  }
  const durable=[];
  for(const h of Object.values(mainViews||{})){
   const a=h.first;if(!a||a.priorSolutionViewed===true)continue;
   try{const t=create(a.recipe);if(t.competition.signature!==h.signature||!Number.isInteger(a.choice)||a.choice<0||a.choice>=5||!Number.isFinite(a.at)||a.at<=0)continue;durable.push({...a,signature:h.signature,correct:a.choice===t.answer,firstAttempt:true,firstCorrect:a.choice===t.answer&&a.hinted!==true})}catch{}
  }
  const candidates=durable.concat(records||[]).map((a,index)=>({...a,order:Number.isSafeInteger(a.order)&&a.order>0?a.order:index+1})).sort((a,b)=>a.at-b.at||a.order-b.order);
  for(const a of candidates){
   const f=byId.get(a.recipe?.familyId);if(!f||!f.topicIds.every(id=>scope.has(id)))continue;
   // Old first-correct facts are usable; unknown first failures are not invented.
   if(!(a.firstAttempt===true&&a.priorSolutionViewed!==true)&&a.firstCorrect!==true)continue;
   let t;try{t=create(a.recipe);if(t.competition.signature!==a.signature||a.correct!==(a.choice===t.answer))continue}catch{continue}
   const canonical=identity.key(t),g=identity.exposure(state,t);if(seen.has(canonical)||g.first?.kind!=='main'||g.first.signature!==a.signature||g.first.at!==a.at)continue;
   seen.add(canonical);
   events.push({signature:a.signature,mathKey:canonical,at:a.at,topicIds:f.topicIds,structure:f.reasoningKey||f.strategy,level:f.level,clean:g.cleanFirst===true,transfer:variations.get(a.signature)});
  }
  const topics={};
  for(const id of topicIds){
   let band=2,stage=[],recent=[],promotions=0,demotions=0;
   for(const e of events.filter(e=>e.topicIds.includes(id))){
    recent.push(e);recent=recent.slice(-4);stage.push(e);stage=stage.slice(-8);
    const struggle=e=>!e.clean||e.transfer===false;
    // Require two different first attempts, never two clicks on one problem.
    if(recent.filter(struggle).length>=2&&struggle(e)){
     if(band>1){band--;demotions++}recent=[];stage=[];continue;
    }
    const clean=stage.filter(e=>e.clean&&e.transfer!==false&&e.level>=band),structures=new Set(clean.map(e=>e.structure));
    const transfer=clean.some(e=>e.transfer===true),probe=clean.some(e=>e.level>band);
    if(band<3&&probe&&structures.size>=2&&clean.length>=(transfer?2:3)){
     band++;promotions++;stage=[];recent=[];
    }
   }
   const clean=stage.filter(e=>e.clean&&e.transfer!==false&&e.level>=band);
   const ready=band<3&&recent.length>=2&&recent.slice(-2).every(e=>e.clean&&e.transfer!==false&&e.level>=band);
   topics[id]={band,target:ready?band+1:band,probe:ready,firstProblems:events.filter(e=>e.topicIds.includes(id)).length,promotions,demotions,cleanRecent:clean.length};
  }
  return {topics,eventCount:events.length};
 }
 function competitionAdaptiveTarget(profile,family){
  const rows=family.topicIds.map(id=>profile.topics[id]||{band:2,target:2,probe:false});
  return {level:Math.min(...rows.map(r=>r.target)),probe:rows.every(r=>r.probe),band:Math.min(...rows.map(r=>r.band))};
 }
 return {competitionAdaptiveProfile,competitionAdaptiveTarget};
})(typeof module!=='undefined'?require('./competition_reviewed').COMPETITION_REVIEWED:COMPETITION_REVIEWED,typeof module!=='undefined'?require('./competition').competitionCreate:competitionCreate,typeof module!=='undefined'?require('./competition').competitionValueEqual:competitionValueEqual,typeof module!=='undefined'?require('./competition_identity'):CompetitionIdentity);
if(typeof module!=='undefined')module.exports={competitionAdaptiveProfile,competitionAdaptiveTarget};

'use strict';
let competitionSceneSerial=0;
function competitionScene(d){
 const e=esc,numeric=v=>typeof v==='string'&&v.includes('/')?v.split('/').map(Number).reduce((a,b)=>a/b):Number(v);
 const caption=d.caption||'',uid='scene-'+(++competitionSceneSerial),text=(x,y,t,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${e(t)}</text>`;
 const svg=(art,description=caption,w=480,h=220)=>`<svg class="scene-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${e(description)}"><title>${e(description)}</title><defs><linearGradient id="${uid}-shine" x2="0" y2="1"><stop stop-color="#fff9be"/><stop offset=".5" stop-color="#f7c64d"/><stop offset="1" stop-color="#ca8a18"/></linearGradient><linearGradient id="${uid}-blue" x2="0" y2="1"><stop stop-color="#adddf9"/><stop offset="1" stop-color="#4694cc"/></linearGradient><linearGradient id="${uid}-red" x2="0" y2="1"><stop stop-color="#ffb09e"/><stop offset="1" stop-color="#d8584b"/></linearGradient></defs>${art}</svg>`;
 const wrap=body=>`<figure class="competition-scene" data-scene-kind="${e(d.kind)}">${body}${caption?`<figcaption>${e(caption)}</figcaption>`:''}</figure>`;
 const person=(color='blue')=>`<span class="scene-person ${color}" aria-hidden="true"><i class="scene-head"><b></b></i><i class="scene-body"></i><i class="scene-arm left"></i><i class="scene-arm right"></i><i class="scene-leg left"></i><i class="scene-leg right"></i></span>`;
 const object=(type,color)=>type==='person'?person(color):`<span class="scene-object ${e(type||'block')} ${color}" aria-hidden="true"></span>`;
 const objects=(count,type='block',color='blue')=>{
  if(!Number.isInteger(count)||count<0)return `<span class="scene-unknown" aria-label="数量未知">?</span>`;
  if(count>18)return `<span class="scene-compressed">${object(type,color)}<b>× ${count}</b></span>`;
  return Array.from({length:count},()=>object(type,color)).join('')||'<span class="scene-empty">0</span>';
 };
 const score=v=>{
  if(v===null||v===undefined)return '';
  const amount=numeric(v);
  let coins='',multiplier='';
  if(amount===0)coins='';
  else if(amount>0&&amount<=12){const whole=Math.floor(amount),part=amount-whole;coins=Array.from({length:whole},()=>'<i class="scene-point" aria-hidden="true"></i>').join('');if(part>1e-10)coins+=`<i class="scene-point scene-partial-point" style="--part:${part}" aria-hidden="true"></i>`}
  else {coins='<i class="scene-point" aria-hidden="true"></i>';multiplier='× '}
  return `<span class="scene-score"><span class="scene-points" data-token-value="${e(v)}"${Number.isInteger(amount)&&amount<=12?` data-token-count="${amount}"`:''}>${coins}</span><strong>${multiplier}${e(v)}</strong></span>`;
 };
 if(d.kind==='scene-stage'){
  const picture=d.routeDiagram?competitionDiagram(d.routeDiagram):competitionDiagram(d.scene);
  return `<section class="scene-stage" data-scene-stage="${e(d.stage.kind)}" data-step="${d.stage.step||0}">${picture}<p class="scene-step-caption">${e(d.stage.text)}</p></section>`;
 }
 if(d.kind==='scene-units')return wrap(`<div class="scene-groups">${d.groups.map((g,i)=>`<section class="scene-group" data-count="${e(g.count)}"><header><b>${e(g.name)}</b><span>${e(g.count)} ${e(g.unit)}</span></header><div class="scene-objects">${objects(g.count,d.object,i===0?'red':'blue')}</div>${g.score!==null&&g.score!==undefined?`<div class="scene-per-person">${d.scoreLabel||('每'+(d.object==='person'?'人':['ticket','stamp'].includes(d.object)?'张':d.object==='coin'?'枚':'个'))} ${score(g.score)} ${e(d.scoreUnit||(['ticket','stamp','coin'].includes(d.object)?'元':'分'))}</div>`:''}</section>`).join('')}</div>${d.average!==undefined?`<p class="scene-target">全体平均：${e(d.average)} 分</p>`:''}`);
 if(d.kind==='scene-share')return wrap(`<p class="scene-target">总分 ${e(d.totalScore)} ÷ ${d.people} 份</p><div class="scene-share-people">${Array.from({length:d.people},()=>`<div>${person('blue')}<div>${score(d.average)}</div></div>`).join('')}</div>${d.base!==null?`<p class="scene-target">每人 ${e(d.base)} + ${e(d.extraAverage)} = ${e(d.average)}</p>`:''}`);
 if(d.kind==='scene-areaPairs')return wrap(`<div class="scene-area-pairs">${d.rows.map(r=>`<div><svg class="scene-pair-svg" viewBox="0 0 150 95" role="img" aria-label="长${r.h}，宽${r.w}，面积${r.area}"><rect x="12" y="10" width="${110*r.h/Math.max(r.w,r.h)}" height="${65*r.w/Math.max(r.w,r.h)}" fill="#b8d8e9" stroke="#577b92"/><text x="75" y="91" text-anchor="middle">${r.w} × ${r.h} = ${r.area}</text></svg></div>`).join('')}</div>`);
 if(d.kind==='scene-purchase'){
  const packs=d.packs||[{size:d.size,price:d.pack}];
  const type=/苗/.test(d.object)?'seedling':'pencil',unit=d.object?.[0]||'支';
  return wrap(`<div class="scene-purchase"><div class="scene-products">${packs.map(p=>`<section class="scene-package"><div class="scene-package-top">${e(p.size)} ${e(unit)}装</div><div class="scene-package-items">${objects(p.size,type,'blue')}</div><div class="scene-price">每包 ${e(p.price)} 元</div></section>`).join('')}${d.single!==undefined?`<section class="scene-single">${objects(1,type)}<p>单${e(unit)} ${e(d.single)} 元</p></section>`:''}</div><div class="scene-demand"><b>需要 ${d.enough?'至少':'恰好'} ${e(d.count)}</b><span>${e(d.object||'支笔')}</span></div></div>`);
 }
 if(d.kind==='scene-slots')return wrap(`<div class="scene-slots"${d.choose?` data-choose="${d.choose}"`:''}>${d.values.map((v,i)=>`<div class="scene-slot"><b>${e(v)}</b>${d.positions?`<span>${i+1}</span>`:''}</div>`).join('')}</div>`);
 if(d.kind==='scene-placeValue')return wrap(`<div class="scene-place-rows">${d.rows.map(r=>`<div><span>${e(r.label)}</span><div class="scene-slots">${r.digits.map((digit,i)=>`<div class="scene-slot"><b>${e(digit)}</b><small>${e(['百位','十位','个位'].slice(-r.digits.length)[i])}</small></div>`).join('')}</div></div>`).join('')}</div>`);
 if(d.kind==='scene-flow')return wrap(`<div class="scene-flow">${d.nodes.map((n,i)=>`${i?'<span class="scene-flow-arrow" aria-hidden="true">→</span>':''}<div class="scene-flow-node"><span>${e(n.label)}</span><b>${e(n.value)}</b></div>`).join('')}</div>`);
 if(d.kind==='scene-twoFlows')return wrap(`<div class="scene-two-flows">${d.rows.map(r=>`<div><b>${e(r.name)}</b><div class="scene-flow">${r.nodes.map((value,i)=>`${i?'<span class="scene-flow-arrow" aria-hidden="true">→</span>':''}<div class="scene-flow-node"><b>${e(value)}</b></div>`).join('')}</div></div>`).join('')}</div>`);
 if(d.kind==='scene-strips'){
  const max=Math.max(...d.rows.map(r=>r.parts));
  return wrap(`<div class="scene-strip-rows">${d.rows.map((r,i)=>{const cells=Number.isInteger(r.parts)&&r.parts<=24?Array.from({length:r.parts},()=>'<i></i>').join(''):'<i></i>';return `<div class="scene-strip-row"><b>${e(r.label)}</b><div class="scene-strip ${i%2?'blue':'red'}" style="width:${d.separateWholes?100:Math.max(6,100*r.parts/max)}%" data-parts="${r.parts}">${cells}</div><span>${e(r.value)}</span></div>`}).join('')}</div>`);
 }
 if(d.kind==='scene-fractions'){
  const cells=(n,used)=>Array.from({length:n},(_,i)=>`<i class="${i<used?'scene-used':''}"><span>${i<used?'用':'留'}</span></i>`).join('');
  return wrap(`<div class="scene-fraction-rows"><section><header>最初：${e(d.start)} ${e(d.unit)}</header><div class="scene-fraction-strip">${cells(d.d1,1)}</div><small>第一次的整体是最初全部</small></section><section class="${d.original?'':'scene-subwhole'}"${d.original?'':` style="width:${100*(d.secondOfUsed?1:d.d1-1)/d.d1}%"`}><header>第二次整体：${d.original?'最初全部':d.secondOfUsed?'第一次用掉':'第一次剩余'}</header><div class="scene-fraction-strip">${cells(d.d2,1)}</div><small>用掉这个整体的 1/${d.d2}</small></section><p>最后剩 ${e(d.left)} ${e(d.unit)}</p></div>`);
 }
 if(d.kind==='scene-join'){
  let art='';const pieceW=Math.min(116,360/d.n),lapW=pieceW*.16,x0=45,y=d.closed?45:85;
  if(!d.closed){for(let i=0;i<d.n;i++){const x=x0+i*(pieceW-lapW);art+=`<rect x="${x}" y="${y+i%2*7}" width="${pieceW}" height="35" rx="6" fill="url(#${uid}-${i%2?'red':'blue'})" stroke="#356878"/>`;if(i)art+=`<rect x="${x}" y="${y}" width="${lapW}" height="42" class="scene-overlap"/>`;art+=text(x+pieceW/2,y-14+i%2*7,'段'+(i+1))}
   art+=text(240,163,`每段 ${d.piece} 厘米；搭接 ${d.lap} 厘米`)+text(240,190,`长条总长 ${d.total} 厘米`);
  }else{
   for(let i=0;i<d.n;i++){const a=2*Math.PI*i/d.n,b=2*Math.PI*(i+1)/d.n,x=240+98*Math.cos(a),yy=102+65*Math.sin(a),xx=240+98*Math.cos(b),yyy=102+65*Math.sin(b);art+=`<path d="M${x} ${yy} L${xx} ${yyy}" stroke="${i%2?'#dc7664':'#64a7d4'}" stroke-width="19" stroke-linecap="round"/><circle cx="${x}" cy="${yy}" r="12" class="scene-overlap"/>`+text(240+140*Math.cos(a+Math.PI/d.n),102+85*Math.sin(a+Math.PI/d.n),'段'+(i+1))}
   art+=text(240,98,`每段 ${d.piece} 厘米`)+text(240,124,`每处重叠 ${d.lap} 厘米`);
  }return wrap(svg(art,`${d.n} 段${d.closed?'首尾闭合':'排成长条'}；每段 ${d.piece}，每处重叠 ${d.lap}；示意不按长度比例`));
 }
 if(d.kind==='scene-intervals'){
  const k=d.distance/d.gap;let art='<path d="M35 92 H445" class="scene-line"/>';
  for(let i=0;i<=k;i++){const x=35+410*i/k,active=d.ends||i>0&&i<k;art+=`<circle cx="${x}" cy="92" r="${active?7:5}" class="${active?'scene-mark':'scene-open-mark'}"/>`+text(x,124,i*d.gap);if(i<k)art+=text(x+205/k,67,d.gap)}
  art+=text(240,172,`总长 ${d.distance} 米；${d.ends?'端点也放':'端点不放（空心）'}`);return wrap(svg(art));
 }
 if(d.kind==='scene-ratioRectangle'){
  let art=`<rect x="70" y="50" width="${290*d.b/(d.a+d.b)}" height="${120*d.a/(d.a+d.b)}" class="scene-shape"/>`+text(240,185,`长 ${d.b} 份`)+text(380,108,`宽 ${d.a} 份`)+text(240,24,`一周 ${d.perimeter} 米`)+text(240,211,`宽 ${d.width} 米`);return wrap(svg(art,caption+'；示意图，比例按标注'));
 }
 if(d.kind==='scene-fixedPerimeter')return wrap(svg('<rect x="50" y="55" width="165" height="70" class="scene-shape"/><rect x="280" y="38" width="118" height="100" class="scene-shape"/>'+text(130,151,'长 ?，宽 ?')+text(340,162,'长 ?，宽 ?')+text(240,25,`同一周长 ${2*d.half}`),'同周长长方形的不同形状；示意图，边长未知'));
 if(d.kind==='scene-overlapSequence'){
  const start=40,cell=400/d.n,firstEnd=start+d.k*cell,lastStart=start+(d.k-1)*cell;
  let art=`<rect x="${start}" y="58" width="${d.k*cell}" height="56" rx="8" fill="#fbe1d7"/><rect x="${lastStart}" y="88" width="${d.k*cell}" height="56" rx="8" fill="#c4dfef"/>`;
  for(let i=0;i<d.n;i++)art+=`<rect x="${start+i*cell+2}" y="96" width="${cell-4}" height="30" rx="4" fill="${i===d.k-1?'#f9ca63':'white'}" stroke="#66858b"/>`+text(start+(i+.5)*cell,117,i===d.k-1&&d.knownMiddle!==null&&d.knownMiddle!==undefined?d.knownMiddle:'?')+text(start+(i+.5)*cell,163,i+1);
  art+=text((start+firstEnd)/2,40,`前 ${d.k} 个${d.totals?'合计 '+d.totals[0]:'平均 '+d.means[0]}`)+text((lastStart+440)/2,191,`后 ${d.k} 个${d.totals?'合计 '+d.totals[1]:'平均 '+d.means[1]}`)+text(240,216,`全部 ${d.n} 个${d.totals?'合计 '+d.totals[2]:'平均 '+d.means[2]}`);return wrap(svg(art,caption));
 }
 if(d.kind==='scene-balance'){
  let art='<path d="M240 91 V162 M195 166 H285 M86 65 H394 M98 65 V105 M382 65 V105" class="scene-line"/><path d="M42 105 Q98 160 154 105 Z M326 105 Q382 160 438 105 Z" class="scene-shape"/>';
  for(const [side,x]of [[d.left,52],[d.right,336]]){for(let i=0;i<side.boxes;i++)art+=`<rect x="${x+i*19}" y="83" width="16" height="20" rx="3" fill="url(#${uid}-blue)" stroke="#406d89"/>`;art+=text(x+44,151,side.weight+' 克')}
  art+=text(98,28,'左')+text(382,28,'右');return wrap(svg(art));
 }
 if(d.kind==='scene-circle'){
  const n=d.values.length;let art='';
  if(d.sectors){for(let i=0;i<n;i++){const a=-Math.PI/2+2*Math.PI*i/n,b=a+2*Math.PI/n,x=240+76*Math.cos(a),y=99+76*Math.sin(a),xx=240+76*Math.cos(b),yy=99+76*Math.sin(b),middle=(a+b)/2,val=d.values[i];art+=`<path d="M240 99 L${x} ${y} A76 76 0 ${b-a>Math.PI?1:0} 1 ${xx} ${yy} Z" fill="${d.excluded?.includes(val)?'#e8e8e8':val==='A'?'#f2bda5':val==='B'?'#b0d7ea':'#c6dfb5'}" stroke="white"/>`+text(240+54*Math.cos(middle),99+54*Math.sin(middle),val)}
  }else{art='<ellipse cx="240" cy="105" rx="118" ry="65" class="scene-tabletop"/>';for(let i=0;i<n;i++){const a=-Math.PI/2+2*Math.PI*i/n,x=240+143*Math.cos(a),y=105+79*Math.sin(a);art+=`<circle cx="${x}" cy="${y}" r="17" class="scene-shape"/>`+text(x,y+5,d.values[i])}}
  return wrap(svg(art));
 }
 if(d.kind==='scene-timeline'){
  const values=d.events,min=Math.min(...values),max=Math.max(...values),x=v=>55+370*(v-min)/(max-min||1);let art='<path d="M45 100 H440" class="scene-line"/>';
  for(const v of values)art+=`<circle cx="${x(v)}" cy="100" r="5" class="scene-mark"/>`+text(x(v),137,v);
  return wrap(svg(art,caption));
 }
 if(d.kind==='scene-twoTimelines'){
  let art='';for(let j=0;j<2;j++){const y=68+78*j,offset=d.offsets?.[j]||0;art+=`<path d="M45 ${y} H440" class="scene-line"/>`+text(23,y+6,j?'乙':'甲');for(let t=offset;t<=d.end;t+=d.periods[j]){const x=45+395*t/(d.end||1);art+=`<circle cx="${x}" cy="${y}" r="4" class="${!t&&!d.includeStart?'scene-open-mark':'scene-mark'}"/>`+text(x,y+24,t)}}return wrap(svg(art));
 }
 if(d.kind==='scene-journey')return wrap(`<div class="scene-journeys">${d.segments.map((s,i)=>`<div><b>${e(s.name)}</b><div class="scene-track"><i>${i?'←':'→'}</i></div><span>${e(s.speed)} ${d.distance?'千米/时':'单位/分钟'}</span>${d.distance?`<small>路程 ${d.distance}</small>`:''}</div>`).join('')}</div>${d.delay?`<p>先行时间 ${d.delay} 分钟</p>`:''}`);
 if(d.kind==='scene-climb'){
  const top=25,bottom=175,x=210;let art=`<path d="M${x} ${top} V${bottom}" class="scene-line"/><path d="M185 ${top} H255" stroke="#bf7256" stroke-width="4"/>`+text(289,top+5,d.height+'米')+text(184,bottom+20,'0');
  art+=`<path d="M170 ${bottom} V${bottom-140*d.up/d.height}" class="scene-up"/><path d="M250 ${bottom-140*d.up/d.height} V${bottom-140*(d.up-d.down)/d.height}" class="scene-down"/>`+text(113,111,'白天 +'+d.up)+text(326,144,'夜晚 −'+d.down);return wrap(svg(art));
 }
 if(d.kind==='scene-choices')return wrap(`<div class="scene-choice-cards">${d.values.map(x=>`<b>${e(x)}</b>`).join('')}</div><div class="scene-slots">${Array.from({length:d.places},(_,i)=>`<div class="scene-slot"><b>?</b><span>${i?'个位':'十位'}</span></div>`).join('')}</div><p>${d.repeat?'允许重复':'不能重复同一张卡'}</p>`);
 if(d.kind==='scene-product')return wrap(svg(`<rect x="54" y="35" width="135" height="135" class="scene-shape"/><rect x="272" y="35" width="157" height="112" class="scene-shape"/><rect x="272" y="35" width="23" height="112" fill="#f2c16b"/>`+text(120,197,`${d.n} × ${d.n}`)+text(350,180,`${d.n-d.delta} × ${d.n+d.delta}`),caption+'；分配关系示意，不按数字作单位格'));
 if(d.kind==='scene-squareBounds')return wrap(svg('<path d="M75 105 H405" class="scene-line"/><path d="M115 91 V119 M365 91 V119" class="scene-line"/><circle cx="240" cy="105" r="5" class="scene-mark"/>'+text(115,152,'?²')+text(240,81,d.n)+text(365,152,'(?+1)²')+text(240,193,d.upper?'求右侧边界整数':'求左侧边界整数'),caption));
 if(d.kind==='scene-age')return wrap(`<div class="scene-two-flows"><div><b>孩子</b><div class="scene-flow"><div class="scene-flow-node">${d.ago}年前 ?</div><span>→</span><div class="scene-flow-node">现在 ${e(d.child)}</div><span>→</span><div class="scene-flow-node">未来 ?</div></div></div><div><b>大人</b><div class="scene-flow"><div class="scene-flow-node">${d.ago}年前 ?</div><span>→</span><div class="scene-flow-node">现在 ${e(d.parent)}</div><span>→</span><div class="scene-flow-node">未来 ?</div></div></div><p>同一时刻，年龄差总为 ${d.gap}</p></div>`);
 if(d.kind==='scene-factorPairs')return wrap(svg('<rect x="55" y="45" width="160" height="90" class="scene-shape"/><rect x="280" y="26" width="80" height="160" class="scene-shape"/>'+text(135,165,'长 ? × 宽 ?')+text(400,108,'?')+text(240,213,`面积都为 ${d.product}`),caption+'；因数对应两条边，形状为示意'));
 if(d.kind==='scene-exponentGrid'){
  const cell=Math.min(25,330/(d.a+1),145/(d.b+1));let art='';for(let j=0;j<=d.b;j++)for(let i=0;i<=d.a;i++)art+=`<rect x="${70+i*cell}" y="${40+j*cell}" width="${cell}" height="${cell}" fill="${d.even&&(i%2||j%2)?'#ececea':'#acd1e7'}" stroke="white"/>`;
  art+=text(240,202,`2的指数：0…${d.a}；3的指数：0…${d.b}`)+text(240,22,'每个位置对应一个正因数');return wrap(svg(art));
 }
 if(d.kind==='scene-cumulative')return wrap(`<div class="scene-cumulative">${d.values.map((v,i)=>`<div><b>≤${i+1} 分：${v} 人</b><div class="scene-cumulative-bar" style="width:${100*v/d.values.at(-1)}%">${Array.from({length:i+1},(_,j)=>`<i>${j+1}分档</i>`).join('')}</div></div>`).join('')}</div>`);
 if(d.kind==='scene-branch')return wrap(`<div class="scene-branches">${d.branches.map(b=>`<div class="scene-flow"><div class="scene-flow-node"><b>${e(b.label)} ${b.count} 种</b></div>${b.next?`<span>→</span><div class="scene-flow-node"><b>${e(b.next.label)} ${b.next.count} 种</b></div>`:''}</div>`).join('<b class="scene-or">或</b>')}</div>${d.drinks?'<p class="scene-all-branches">两种午餐分支都再配：3种饮料</p>':''}`);
 if(d.kind==='scene-diceGrid'){
  const cell=Math.min(17,145/d.faces);let art='';for(let j=1;j<=d.faces;j++)for(let i=1;i<=d.faces;i++)art+=`<rect x="${125+(i-1)*cell}" y="${28+(j-1)*cell}" width="${cell}" height="${cell}" fill="${d.different&&i===j?'#e4e4e4':'#bdd9e9'}" stroke="white"/>`;
  art+=text(240,196,`行、列点数各 1 到 ${d.faces}，每格一个有序对`)+text(240,219,`目标：点数和 ${d.target}${d.different?'；灰色对角线不在样本中':''}`);return wrap(svg(art));
 }
 if(d.kind==='scene-remainderCards'){
  const blocks=Math.floor(d.count/d.mod),tail=d.count%d.mod;return wrap(`<div class="scene-remainder-cards">${d.includeZero?'<b class="scene-card">0</b>':''}<div class="scene-slots">${Array.from({length:d.mod},(_,i)=>`<div class="scene-slot"><b>${i+1}</b><span>余 ${(i+1)%d.mod}</span></div>`).join('')}</div><p>这样的完整组共 ${blocks} 组</p><div class="scene-slots">${Array.from({length:tail},(_,i)=>`<div class="scene-slot"><b>${blocks*d.mod+i+1}</b><span>余 ${i+1}</span></div>`).join('')}</div><p>目标余数 ${d.wanted}</p></div>`);
 }
 if(d.kind==='scene-sets'){
  let art='<rect x="35" y="15" width="410" height="182" rx="12" class="scene-domain"/><ellipse cx="197" cy="102" rx="101" ry="64" fill="#ffb19c" fill-opacity=".55" stroke="#ab6554"/><ellipse cx="292" cy="102" rx="101" ry="64" fill="#86bfdf" fill-opacity=".55" stroke="#477693"/>';
  art+=text(160,74,'甲组 '+d.a)+text(333,74,'乙组 '+d.b)+text(246,118,'交集 '+d.both);
  if(d.total!==null)art+=text(240,181,'全体 '+d.total);
  if(d.change)art+=text(240,220,d.change==='one-joins-second'?'一个只在甲的人 → 也加入乙':'一个圈外的人 → 同时加入两组');
  return wrap(svg(art,caption+'；区域面积不代表人数'));
 }
 if(d.kind==='scene-threeSets')return wrap(svg('<circle cx="205" cy="91" r="67" fill="#efd7bd" fill-opacity=".6" stroke="#977c59"/><circle cx="280" cy="91" r="67" fill="#b2d1e4" fill-opacity=".6" stroke="#5b7a91"/><circle cx="242" cy="149" r="67" fill="#c9dcb2" fill-opacity=".6" stroke="#6d855d"/>'+text(242,59,'甲乙 '+d.ab)+text(186,152,'甲丙 '+d.ac)+text(300,152,'乙丙 '+d.bc)+text(242,115,'三组 '+d.triple),caption+'；两组数字包含中心，不按区域面积估人数'));
 if(d.kind==='scene-ballRule')return wrap(`<div class="scene-groups"><div class="scene-group"><b>白球 ${d.white}</b><div class="scene-objects">${objects(d.white,'ball','white')}</div></div><div class="scene-group"><b>黑球 ${d.black}</b><div class="scene-objects">${objects(d.black,'ball','black')}</div></div></div><div class="scene-flow"><span>白白 / 黑黑</span><span>→</span>${object('ball','black')}<span>；白黑</span><span>→</span>${object('ball','white')}</div>`);
 if(d.kind==='scene-direction'){
  const names=['上0','右1','下2','左3'];return wrap(svg('<circle cx="130" cy="105" r="59" class="scene-domain"/>'+names.map((t,i)=>text(130+87*Math.sin(i*Math.PI/2),105-70*Math.cos(i*Math.PI/2),t)).join('')+`<path d="M130 125 V62 L120 75 M130 62 L140 75" transform="rotate(${d.start*90} 130 105)" class="scene-line"/>`+text(330,82,(d.anticlockwise?'逆':'顺')+'时针 '+d.turns+'×90°')+(d.mirror?text(330,128,d.reverseOrder?'先镜像后旋转':'先旋转后镜像'):''),caption));
 }
 if(d.kind==='scene-stairs'){
  const size=Math.min(14,330/d.n,145/d.n);let art='';for(let x=0;x<d.n;x++)for(let y=0;y<=x;y++)for(let z=d.depth-1;z>=0;z--){const xx=65+x*size+z*size*.35,yy=190-y*size-z*size*.25;art+=`<path d="M${xx} ${yy} l${size} 0 v${-size} h${-size} Z" fill="url(#${uid}-blue)" stroke="#547a91" stroke-width=".5"/><path d="M${xx} ${yy-size} l${size} 0 l${size*.3} ${-size*.3} h${-size} Z" fill="#d2e6f6"/>`}
  art+=text(240,24,`${d.n} 列，厚 ${d.depth} 块；左起高度逐列加1`);return wrap(svg(art));
 }
 if(d.kind==='scene-tiledRectangle')return wrap(svg('<rect x="70" y="38" width="310" height="135" class="scene-shape"/><rect x="70" y="38" width="48" height="48" fill="#f6d495" stroke="#967858"/>'+text(94,66,'?')+text(225,204,`长 ${d.w} 米`)+text(424,112,`宽 ${d.h} 米`),caption+'；标出未知正方形规格，示意不按比例'));
 if(d.kind==='scene-coordinates'){
  const minX=Math.min(0,...[d.a[0],d.b[0]])-1,maxX=Math.max(0,d.a[0],d.b[0])+1,minY=Math.min(0,d.a[1],d.b[1])-1,maxY=Math.max(0,d.a[1],d.b[1])+1,X=x=>65+330*(x-minX)/(maxX-minX),Y=y=>185-145*(y-minY)/(maxY-minY);let art=`<path d="M${X(minX)} ${Y(0)} H${X(maxX)} M${X(0)} ${Y(minY)} V${Y(maxY)}" class="scene-line"/>`;
  for(const [name,p]of [['A',d.a],['B',d.b]])art+=`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="5" class="scene-mark"/>`+text(X(p[0]),Y(p[1])-14,`${name}(${p.join(',')})`);
  art+=`<path d="M${X(d.a[0])} ${Y(d.a[1])} ${d.gridOnly?`H${X(d.b[0])} V${Y(d.b[1])}`:`L${X(d.b[0])} ${Y(d.b[1])}`}" class="scene-up"/>`;return wrap(svg(art));
 }
 if(d.kind==='scene-ladder')return wrap(svg('<path d="M125 23 V175 H392" class="scene-line"/><path d="M125 40 L295 175" stroke="#c18b46" stroke-width="8"/>'+(!d.nextBase?'':'<path d="M125 72 L353 175" stroke="#668daf" stroke-width="7"/>')+text(213,69,`梯长 ${d.length}`)+text(230,204,`底距 ${d.base}`)+text(63,111,`高度 ${d.height}`),caption+'；只按标签给定长度，位置为示意'));
 if(d.kind==='scene-cube'){
  let art='<path d="M157 75 L240 30 L323 75 L323 166 L240 210 L157 166 Z" fill="#cfe3ef" stroke="#54758b"/><path d="M157 75 L240 118 L323 75 M240 118 V210" class="scene-line"/><path d="M157 75 L240 30 L323 75 L240 118 Z" fill="#f2bfa7" stroke="#9a7567"/>';
  for(let i=1;i<d.n;i++){const q=i/d.n;art+=`<path d="M${157+83*q} ${75+43*q} L${240+83*q} ${30+45*q} M${157+83*q} ${75-45*q} L${240+83*q} ${118-43*q} M${157+83*q} ${75+43*q} V${166+44*q} M${240+83*q} ${118-43*q} V${210-44*q}" class="scene-cube-grid"/>`}
  art+=text(391,145,`每棱 ${d.n} 个`)+text(391,181,d.faces.includes('all')?'六面涂色':'只涂顶、底');return wrap(svg(art,caption+'；显示三个可见面，其余面按条件说明'));
 }
 if(d.kind==='scene-holeRectangle')return wrap(svg(`<path d="M70 40 H380 V176 H70 Z M${140} 78 V132 H${140+130*d.a/d.w} V78 Z" fill="#c6dff0" fill-rule="evenodd" stroke="#54758b"/>`+text(224,207,`外长 ${d.w}；外宽 ${d.h}`)+text(242,24,`内部洞 ${d.a} × ${d.b}`),caption+'；洞位置为示意'));
 if(d.kind==='scene-fullCircle')return wrap(svg('<circle cx="240" cy="107" r="77" class="scene-shape"/><path d="M163 107 H317" class="scene-dashed"/>'+text(240,207,`半径 ${d.radius}；π=3`),caption));
 if(d.kind==='scene-polygonAngles')return wrap(svg('<path d="M112 38 L337 29 L381 173 L77 166 Z" class="scene-shape"/>'+d.ratios.map((r,i)=>text([117,334,355,100][i],[63,57,151,145][i],r+'份')).join(''),caption+'；角度以比例标注为准'));
 if(d.kind==='scene-rays'){
  let art='';for(let i=0;i<d.marks;i++){const a=-Math.PI/2+2*Math.PI*i/d.marks;art+=`<path d="M240 109 L${240+81*Math.cos(a)} ${109+81*Math.sin(a)}" class="${i===0||i===d.steps?'scene-up':'scene-dashed'}"/>`}
  art+=text(240,216,`${d.marks} 等份；${d.other?'另一个方向':'较短方向'} ${d.other?d.marks-d.steps:d.steps} 段`);return wrap(svg(art));
 }
 if(d.kind==='scene-polygon'){
  const pts=Array.from({length:d.n},(_,i)=>[240+80*Math.sin(2*Math.PI*i/d.n),108-80*Math.cos(2*Math.PI*i/d.n)]);let art=`<path d="M${pts.map(p=>p.join(' ')).join(' L')} Z" class="scene-shape"/>`;for(let i=0;i<d.steps;i++)art+=`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="5" class="scene-mark"/>`;art+=text(240,215,`经过 ${d.steps} 个顶点`);return wrap(svg(art));
 }
 if(d.kind==='scene-shadows')return wrap(svg(`<path d="M45 171 H439 M70 171 V116 L180 171 M250 171 V39 L420 171" class="scene-line"/>`+text(58,109,'高 '+d.smallHeight)+text(123,198,'影 '+d.smallShadow)+text(227,32,'高 '+d.bigHeight)+text(354,198,'影 '+d.bigShadow),caption+'；图为对应关系示意'));
 if(d.kind==='scene-border'){
  const side=d.n+2,cell=Math.min(9,165/side),ox=140,oy=25;let art='';
  for(let y=0;y<side;y++)for(let x=0;x<side;x++){const original=x>0&&x<side-1&&y>0&&y<side-1,added=d.partial?(x===0&&y<side-1||y===0&&x<side-1):!original;if(!original&&!added)continue;art+=`<rect x="${ox+x*cell}" y="${oy+y*cell}" width="${cell}" height="${cell}" fill="${original?'#c6ddec':'#efc675'}" stroke="white" stroke-width=".4"/>`}
  art+=text(240,212,`原来 ${d.n}×${d.n}，黄色为新增`);return wrap(svg(art));
 }
 throw Error('Unsupported mathematical scene '+d.kind);
}

'use strict';
function competitionState(){
 if(draft.work?.kind!=='competition-work')draft.work={kind:'competition-work',eliminated:[],notes:'',method:0,step:0,hintLevel:0,extensionInput:'',extensionResult:null};
 return draft.work;
}
function competitionRestoreWork(value){
 return {kind:'competition-work',eliminated:Array.isArray(value?.eliminated)?[...new Set(value.eliminated.filter(n=>Number.isInteger(n)&&n>=0&&n<5))]:[],notes:typeof value?.notes==='string'?value.notes.slice(0,1200):'',method:Number.isInteger(value?.method)&&value.method>=0&&value.method<3?value.method:0,step:Number.isInteger(value?.step)&&value.step>=0&&value.step<12?value.step:0,hintLevel:Number.isInteger(value?.hintLevel)?Math.max(0,Math.min(2,value.hintLevel)):0,extensionInput:typeof value?.extensionInput==='string'?value.extensionInput.slice(0,40):'',extensionResult:null};
}
function competitionMainSnapshot(signature,value){
 try{const task=competitionCreate(value?.recipe);if(task.competition.signature!==signature||!Number.isFinite(value.at)||value.at<=0||!Number.isInteger(value.choice)||value.choice<0||value.choice>=5)return null;
 return {recipe:task.competition.recipe,choice:value.choice,at:value.at,order:Number.isSafeInteger(value.order)&&value.order>0?value.order:0,sessionId:typeof value.sessionId==='string'?value.sessionId.slice(0,100):'',hinted:value.hinted===true,priorSolutionViewed:value.priorSolutionViewed===true,independent:value.independent!==false,correct:value.choice===task.answer};}catch{return null}
}
function competitionExtensionSnapshot(signature,value){
 try{const task=competitionCreate(value?.recipe);if(competitionVariationSignature(task)!==signature||!Number.isFinite(value.at)||value.at<=0||typeof value.input!=='string'||value.input.length>40)return null;
 return {recipe:task.competition.recipe,input:value.input,at:value.at,correct:competitionValueEqual(value.input,task.competition.extension.answer)};}catch{return null}
}
function competitionUpdateMainHistory(state,a){
 const key=competitionHash(a.signature),h=state.views[key]??(state.views[key]={at:a.at,signature:a.signature,hinted:false,solutionViewed:false,attempted:false}),snapshot=competitionMainSnapshot(a.signature,a);if(!snapshot||h.signature!==a.signature)return;
 const ownAttempted=h.attempted;h.attempted=true;h.hinted=h.hinted||snapshot.hinted;h.solutionViewed=h.solutionViewed||snapshot.correct;
 if(!h.first&&(a.firstAttempt===true||a.firstCorrect===true||!ownAttempted&&a.equivalentRepeat===true))h.first={...snapshot,independent:a.firstAttempt===true||a.firstCorrect===true};
 if(snapshot.correct&&(!h.solved||snapshot.order>=h.solved.order))h.solved=snapshot;
 if(!h.last||snapshot.order>=h.last.order)h.last=snapshot;
 state.sequence=Math.max(state.sequence,snapshot.order);
 CompetitionIdentity.invalidate(state);
}
function competitionProgressCounts(state=saved.competition){
 return CompetitionIdentity.counts(state);
}
function competitionRestoreRecords(old){
 const state={version:1,sequence:0,attempts:[],views:{},extensions:[],extensionViews:{}};
 for(const [index,a] of (Array.isArray(old?.attempts)?old.attempts.slice(-500):[]).entries()){
  try{const task=competitionCreate(a.recipe);if(a.signature!==task.competition.signature||a.taskId!==task.id||a.contentVersion!==task.contentVersion||!Number.isFinite(a.at)||a.at<=0||!Number.isInteger(a.choice)||a.choice<0||a.choice>=5)continue;state.attempts.push({...a,order:Number.isSafeInteger(a.order)&&a.order>0?a.order:index+1,topicIds:[...task.competition.topicIds],correct:a.choice===task.answer,firstCorrect:a.firstCorrect===true&&a.choice===task.answer&&a.hinted!==true&&a.priorSolutionViewed!==true&&!state.attempts.some(prior=>prior.signature===a.signature),firstAttempt:a.firstAttempt===true&&!state.attempts.some(prior=>prior.signature===a.signature),priorSolutionViewed:a.priorSolutionViewed===true,hinted:a.hinted===true,notes:typeof a.notes==='string'?a.notes.slice(0,1200):''})}catch{}
 }
 for(const [key,h] of Object.entries(old?.views||{}))if(/^[A-F0-9]{8}$/.test(key)&&h&&Number.isFinite(h.at)&&h.at>0&&typeof h.signature==='string'&&h.signature.length<15000&&competitionHash(h.signature)===key){
  const restored=state.views[key]={at:h.at,signature:h.signature,hinted:h.hinted===true,solutionViewed:h.solutionViewed===true,attempted:h.attempted===true};
  if(Number.isFinite(h.hintedAt)&&h.hintedAt>0)restored.hintedAt=h.hintedAt;if(Number.isSafeInteger(h.hintOrder)&&h.hintOrder>0){restored.hintOrder=h.hintOrder;state.sequence=Math.max(state.sequence,h.hintOrder)}
  try{const t=competitionCreate(h.recipe);if(t.competition.signature===h.signature)restored.recipe=t.competition.recipe}catch{}
  for(const field of ['first','solved','last']){const snapshot=competitionMainSnapshot(h.signature,h[field]);if(snapshot&&(field!=='solved'||snapshot.correct)){restored[field]=snapshot;restored.attempted=true;restored.solutionViewed=restored.solutionViewed||snapshot.correct;state.sequence=Math.max(state.sequence,snapshot.order)}}
  if(!restored.solved&&restored.first?.correct)restored.solved=restored.first;
 }
 for(const a of state.attempts)competitionUpdateMainHistory(state,a);
 for(const a of state.attempts){const first=state.views[competitionHash(a.signature)]?.first;if(first){const same=a.choice===first.choice&&a.at===first.at&&a.order===first.order&&JSON.stringify(a.recipe)===JSON.stringify(first.recipe);a.firstAttempt=a.firstAttempt&&same;a.firstCorrect=a.firstCorrect&&same&&first.correct&&!first.hinted&&!first.priorSolutionViewed}}
 for(const [key,h] of Object.entries(old?.extensionViews||{}))if(/^[A-F0-9]{8}$/.test(key)&&h&&Number.isFinite(h.at)&&h.at>0&&typeof h.signature==='string'&&competitionHash(h.signature)===key){state.extensionViews[key]={at:h.at,order:Number.isSafeInteger(h.order)?h.order:0,signature:h.signature,attempted:h.attempted===true,firstIndependent:h.firstIndependent!==false,hinted:h.hinted===true,priorSolutionViewed:h.priorSolutionViewed===true};if(typeof h.firstInput==='string'&&h.firstInput.length<=40){try{const task=competitionCreate(h.recipe);if(competitionVariationSignature(task)===h.signature&&task.competition.signature===h.mainSignature)Object.assign(state.extensionViews[key],{recipe:task.competition.recipe,mainSignature:h.mainSignature,firstInput:h.firstInput.slice(0,40),firstCorrect:h.firstIndependent!==false&&h.hinted!==true&&h.priorSolutionViewed!==true&&competitionValueEqual(h.firstInput,task.competition.extension.answer)})}catch{}}const solved=competitionExtensionSnapshot(h.signature,h.solved);if(solved?.correct){state.extensionViews[key].solved=solved;state.extensionViews[key].attempted=true}else if(state.extensionViews[key].firstCorrect){state.extensionViews[key].solved=competitionExtensionSnapshot(h.signature,{recipe:h.recipe,input:h.firstInput,at:h.at})}}
 for(const a of Array.isArray(old?.extensions)?old.extensions.slice(-300):[]){try{const task=competitionCreate(a.recipe),signature=competitionVariationSignature(task);if(task.id!==a.taskId||task.competition.signature!==a.signature||!Number.isFinite(a.at)||a.at<=0||typeof a.input!=='string'||a.input.length>40||a.variationSignature&&a.variationSignature!==signature)continue;state.extensions.push({...a,variationSignature:signature,firstAttempt:a.firstAttempt===true&&!state.extensions.some(p=>p.variationSignature===signature),input:a.input.slice(0,40),correct:competitionValueEqual(a.input,task.competition.extension.answer)});const h=state.extensionViews[competitionHash(signature)]??(state.extensionViews[competitionHash(signature)]={at:a.at,signature,attempted:true});h.attempted=true;if(a.firstAttempt===true&&typeof h.firstInput!=='string')Object.assign(h,{recipe:task.competition.recipe,mainSignature:a.signature,firstInput:a.input.slice(0,40),firstCorrect:competitionValueEqual(a.input,task.competition.extension.answer)});const solved=competitionExtensionSnapshot(signature,{recipe:a.recipe,input:a.input.slice(0,40),at:a.at});if(solved?.correct)h.solved=solved;}catch{}}
 return state;
}
function competitionVariationSignature(task){return task.competition.extension.signature||JSON.stringify({main:task.competition.signature,variation:task.competition.extension.prompt})}
function competitionHistory(task){
 const c=task.competition,key=competitionHash(c.signature);if(!saved.competition.views[key]){saved.competition.views[key]={at:Date.now(),signature:c.signature,recipe:c.recipe,hinted:false,solutionViewed:false,attempted:false};CompetitionIdentity.invalidate(saved.competition)}return saved.competition.views[key];
}
function competitionSpeechText(value){
 const negative=s=>String(s).replace(/^[-−]/, '负');
 return String(value).replace(/(\d|\))\s*[-−]\s*(?=\d|\()/g,'$1减').replace(/(^|[=(×÷+])\s*[-−](?=\()/g,'$1负').replace(/([-−]?\d+(?:\.\d+)?)\s*\/\s*([-−]?\d+(?:\.\d+)?)/g,(_,n,d)=>negative(d)+'分之'+negative(n)).replace(/\((负?\d+(?:\.\d+)?分之负?\d+(?:\.\d+)?)\)/g,'$1').replace(/√(\d+(?:\.\d+)?)/g,'$1的平方根').replace(/(\d+)²/g,'$1的平方').replace(/(\d+)³/g,'$1的立方').replace(/([厘毫千]?米)²/g,'平方$1').replace(/([厘毫千]?米)³/g,'立方$1').replace(/(\d+(?:\.\d+)?)%/g,'百分之$1').replace(/(\d+(?:\.\d+)?)\s*[:：]\s*(?=\d)/g,'$1比').replace(/[-−](?=\d)/g,'负').replace(/×/g,'乘以').replace(/÷/g,'除以').replace(/\+/g,'加').replace(/≤/g,'小于或等于').replace(/≥/g,'大于或等于').replace(/−/g,'减').replace(/=/g,'等于').replace(/\(/g,'左括号').replace(/\)/g,'右括号').replace(/°/g,'度').replace(/□/g,'空格');
}
function competitionMaterialSpeech(diagram){
 if(!diagram)return '';
 if(diagram.kind==='bars')return '图中，'+diagram.values.map((v,i)=>diagram.names[i]+'柱高'+v+'格'+(diagram.known===i?'，标注'+diagram.knownValue+'人':'')).join('；')+'。';
 if(diagram.kind==='table')return '表格中，'+diagram.rows.map(row=>row.join('，')).join('；')+'。';
 return (diagram.labels||[]).join('；');
}
function competitionQuestionSpeech(task){
 const c=task.competition,material=/如图|如表/.test(task.prompt)?competitionMaterialSpeech(c.diagram):'';
 return competitionSpeechText(task.prompt+(material?' '+material:''));
}
function competitionDiagram(d){
 if(!d)return '';
 if(d.kind?.startsWith('scene-'))return competitionScene(d);
 if(d.kind?.startsWith('rule-'))return competitionRelationDiagram(d);
 const label=(x,y,text,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${esc(text)}</text>`;
 let art='',bottom='';const labels=d.labels||[];
 if(d.kind==='routes'){
  const px=x=>40+190*x/d.w,py=y=>110-80*y/d.h;
  for(let x=0;x<=d.w;x++)art+=`<path class="competition-grid-line" d="M${px(x)} 30 V110"/>`;
  for(let y=0;y<=d.h;y++)art+=`<path class="competition-grid-line" d="M40 ${py(y)} H230"/>`;
  art+=(d.firstUp?`<path stroke="#bc793c" stroke-width="4" d="M${px(0)} ${py(0)} V${py(1)}"/>`:`<circle class="competition-dot" cx="${px(d.x)}" cy="${py(d.y)}" r="4"/>`+label(px(d.x)+10,py(d.y)-8,'P'))+label(28,124,'A')+label(241,25,'B');
  bottom=label(140,145,`向右 ${d.w} 段，向上 ${d.h} 段`);
 }else if(d.kind==='fourAreas'){
  art='<rect class="competition-shape" x="44" y="22" width="196" height="98"/><path class="competition-line" d="M44 22 L145 67 L240 22 M44 120 L145 67 L240 120"/><circle class="competition-dot" cx="145" cy="67" r="3"/>'+label(156,68,'P')+label(143,40,String(d.top))+label(73,74,String(d.left))+label(212,74,String(d.right))+label(143,105,'?');
  bottom=label(142,143,'示意图，面积以标注为准');
 }else if(d.kind==='necklaceBlank'){
  art='<circle class="competition-grid-line" cx="142" cy="67" r="48"/>';
  for(let i=0;i<d.n;i++){const a=2*Math.PI*i/d.n-Math.PI/2;art+=`<circle class="competition-shape" cx="${142+48*Math.cos(a)}" cy="${67+48*Math.sin(a)}" r="7"/>`;if(d.fixed)art+=label(142+65*Math.cos(a),67+65*Math.sin(a)+5,i===0?'★1':i+1)}
  bottom=label(142,136,`${d.n} 个位置：${d.red} 红、${d.n-d.red} 蓝`);
 }else if(d.kind==='rectangleDiagonal'){
  art='<rect class="competition-shape" x="52" y="28" width="180" height="82"/><path class="competition-line" d="M52 110 L232 28"/>'+label(142,133,`长 ${d.w}`)+label(244,76,`宽 ${d.h}`);
 }else if(d.kind==='notch'){
  const cut=180*d.a/d.w,depth=82*d.depth/d.h,left=142-cut/2,right=142+cut/2;
  art=`<path class="competition-shape" d="M52 28 H${left} V${28+depth} H${right} V28 H232 V110 H52 Z"/>`+label(142,133,`长 ${d.w}`)+label(246,91,String(d.h))+label(142,18,`口宽 ${d.a}`)+label(right+17,33+depth/2,`深 ${d.depth}`);
 }else if(d.kind==='lShape'){
  const x=232-180*d.a/d.w,y=28+82*d.b/d.h;
  art=`<path class="competition-shape" d="M52 28 H${x} V${y} H232 V110 H52 Z"/><path class="competition-grid-line" d="M${x} 28 H232 V${y}"/>`+label(142,135,`长 ${d.w}`)+label(33,76,String(d.h))+label((x+232)/2,18,String(d.a))+label(247,26+82*d.b/d.h/2,String(d.b));
 }else if(d.kind==='cross'){
  const aw=180*d.a/d.w,bh=82*d.b/d.h;
  art=`<rect class="competition-shape" x="52" y="28" width="180" height="82"/><rect class="${d.intersectionOnly?'competition-shape':'competition-fill'}" x="${142-aw/2}" y="28" width="${aw}" height="82"/><rect class="${d.intersectionOnly?'competition-shape':'competition-fill'}" x="52" y="${69-bh/2}" width="180" height="${bh}"/>${d.intersectionOnly?`<rect class="competition-fill" x="${142-aw/2}" y="${69-bh/2}" width="${aw}" height="${bh}"/>`:''}`+label(142,135,`长 ${d.w}`)+label(246,79,String(d.h))+label(142,18,`条宽 ${d.a}`)+label(82,74,String(d.b));
 }else if(d.kind==='semicircle'){
  art='<path class="competition-shape" d="M78 100 A64 64 0 0 1 206 100 Z"/><path class="competition-line" d="M142 100 H206"/>'+label(171,122,`半径 ${d.radius}`);
 }else if(d.kind==='ring'){
  art=`<circle class="competition-shape" cx="142" cy="69" r="47"/><circle class="competition-shape" cx="142" cy="69" r="${47*d.r1/d.r2}"/>`+label(142,136,`半径 ${d.r1} 与 ${d.r2}`);
 }else if(d.kind==='parallelTriangle'){
  const q=d.k/d.n,y=24+86*q,x=142-80*q;
  art=`<path class="competition-shape" d="M142 24 L62 110 H222 Z"/><path class="competition-line" d="M${x} ${y} H${284-x}"/>`+label(142,137,`对应边长比 ${d.k}:${d.n}`);
 }else if(d.kind==='hypotenuseMidpoint'){
  const mx=d.legMidpoint?106:139;
  art='<path class="competition-shape" d="M106 110 V22 L172 110 Z"/><path class="competition-line" d="M106 99 H117 V110"/>'+(d.legMidpoint?'<path class="competition-line" d="M102 44 H110 M102 88 H110"/>':'<path class="competition-line" d="M119.5 46 L125.5 42 M152.5 90 L158.5 86"/>')+`<path class="competition-grid-line" stroke-dasharray="4 3" d="M106 110 L${mx} 66"/><circle class="competition-dot" cx="${mx}" cy="66" r="3"/>`+label(mx+15,67,'M')+label(121,94,'?')+label(139,132,String(3*d.k))+label(86,69,String(4*d.k));
 }else if(d.kind==='boxNet'){
  art='<rect class="competition-shape" x="98" y="25" width="84" height="84"/>';
  const cut=d.cut?84*d.cut/d.side:17;
  for(const x of [98,182-cut])for(const y of [25,109-cut])art+=`<rect class="competition-fill" x="${x}" y="${y}" width="${cut}" height="${cut}"/>`;
  art+=`<path class="competition-grid-line" stroke-dasharray="4 3" d="M${98+cut} ${25+cut} H${182-cut} V${109-cut} H${98+cut} Z"/>`+label(140,17,`纸边 ${d.side}`)+label(98+cut/2,25+cut/2+4,d.cut||'x')+label(140,128,`四角各剪 ${d.cut||'x'} × ${d.cut||'x'}`)+label(140,147,d.cut?'中央底面积 ?':'示意图，x 为待选长度');
 }else if(d.kind==='angleRatioTriangle'){
  art='<path class="competition-shape" d="M55 108 L113 31 L230 108 Z"/>'+label(38,111,`${d.ratios[0]}份`)+label(247,111,`${d.ratios[1]}份`)+label(113,18,`${d.ratios[2]}份`)+label(142,144,'示意图，角度按标注比例');
 }else if(d.kind==='truncatedBars'){
  const scale=80/d.b;
  art='<path class="competition-line" d="M54 22 V110 H240"/>';
  const tickEvery=Math.max(1,Math.ceil(d.b/4));
  for(let i=0;i<=d.b;i++){art+=`<path class="competition-grid-line" d="M54 ${110-i*scale} H240"/>`;if(i===0||i===d.b||i%tickEvery===0&&i<=d.b-tickEvery)art+=label(47,114-i*scale,String(d.base+i*d.step),'end')}
  art+=`<rect class="competition-fill" x="90" y="${110-d.a*scale}" width="37" height="${d.a*scale}"/><rect class="competition-fill" x="173" y="30" width="37" height="80"/>`+label(108,132,'甲')+label(192,132,'乙');
 }else if(d.kind==='checker'){
  const size=Math.min(190/d.w,106/d.h),ox=(285-size*d.w)/2,oy=10;
  for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++){
   const removed=x===0&&y===0||x===d.w-1&&y===(d.removeTop?0:d.h-1);
   art+=`<rect class="${removed?'competition-grid-line':(x+y)%2===0?'competition-dot':'competition-shape'}" x="${ox+x*size}" y="${oy+y*size}" width="${size}" height="${size}"/>`;
   if(removed)art+=`<path class="competition-line" d="M${ox+x*size+2} ${oy+y*size+2} l${size-4} ${size-4} m0 ${4-size} l${4-size} ${size-4}"/>`;
  }
  bottom=label(142,139,`${d.w} 列 × ${d.h} 行，${d.removeTop?'同一行两角':'对角'}去掉`);
 }else if(d.kind==='squareBorder'){
  art='<rect class="competition-fill" x="80" y="12" width="116" height="116"/><rect class="competition-shape" x="94" y="26" width="88" height="88"/>'+label(138,75,`${d.n} × ${d.n}`);bottom=label(138,146,'新增外面一圈');
 }else if(d.kind==='overlapSquares'){
  const scale=Math.min(190/(d.n+d.dx),100/(d.n+d.dy)),side=d.n*scale,ox=40,oy=122,dx=d.dx*scale,dy=d.dy*scale;
  art=`<rect class="${d.exclusive?'competition-fill':'competition-shape'}" x="${ox}" y="${oy-side}" width="${side}" height="${side}"/><rect class="${d.exclusive?'competition-fill':'competition-shape'}" x="${ox+dx}" y="${oy-side-dy}" width="${side}" height="${side}"/><rect class="${d.exclusive?'competition-shape':'competition-fill'}" x="${ox+dx}" y="${oy-side}" width="${side-dx}" height="${side-dy}"/>`;
  bottom=label(144,146,`边长 ${d.n}，右移 ${d.dx}，上移 ${d.dy}`);
 }else if(d.kind==='isoscelesExterior'){
  art='<path class="competition-shape" d="M67 108 L142 25 L217 108 Z"/><path class="competition-line" d="M217 108 L246 140"/>'+label(142,50,d.apex+'°')+label(237,105,d.target==='other-base'?(90+d.apex/2)+'°':'?')+(d.target==='other-base'?label(77,104,'?'):'');bottom=label(132,142,'两条腰相等');
 }else if(d.kind==='circleRoute'){
  art='<circle class="competition-shape" cx="142" cy="70" r="46"/>';
  for(let i=0;i<d.sectors;i++){const angle=-Math.PI/2+2*Math.PI*i/d.sectors,x=142+46*Math.cos(angle),y=70+46*Math.sin(angle);art+=`<circle class="competition-dot" cx="${x}" cy="${y}" r="2.5"/>`;if(i===0||i===d.steps)art+=label(142+61*Math.cos(angle),70+61*Math.sin(angle)+5,i===0?'A':'B')}
  bottom=label(142,145,`${d.sectors} 段等长弧`);
 }else if(d.kind==='foldHoles'){
  art='<rect class="competition-shape" x="95" y="22" width="90" height="90"/><path class="competition-line" d="M95 22 H185 M95 22 V112"/>';
  for(let i=0;i<d.interior;i++)art+=`<circle class="competition-dot" cx="${125+(i%2)*32}" cy="${52+Math.floor(i/2)*32}" r="4"/>`;
  for(let i=0;i<d.edge;i++)art+=`<circle class="competition-dot" cx="95" cy="${40+i*18}" r="4"/>`;
  if(d.center)art+='<circle class="competition-dot" cx="95" cy="22" r="4"/>';
  art+=label(142,15,'上边、左边是折痕');bottom=label(142,139,'折成四层后的示意图');
 }else if(d.kind==='bars'){
  const max=Math.max(...d.values),scale=84/max;
  art='<path class="competition-line" d="M40 20 V112 H257"/>';
  for(let i=0;i<=max;i++)art+=`<path class="competition-grid-line" d="M40 ${112-i*scale} H254"/>`+label(32,116-i*scale,String(i),'end');
  d.values.forEach((v,i)=>{art+=`<rect class="competition-fill" x="${65+i*63}" y="${112-v*scale}" width="35" height="${v*scale}"/>`+label(82+i*63,132,d.names[i]);if(d.known===i)art+=label(82+i*63,105-v*scale,d.knownValue+' 人')});
 }else if(d.kind==='garden'){
  const w=d.width,h=d.height,cw=d.cutWidth??0,ch=d.cutHeight??0;
  art=`<rect class="competition-shape" x="42" y="24" width="180" height="82"/>${cw?`<rect class="competition-fill" x="42" y="${106-82*ch/h}" width="${180*cw/w}" height="${82*ch/h}"/>`:''}`+label(132,17,`长 ${w}`)+label(232,70,`宽 ${h}`,'start');
  if(cw&&!(cw===w/2&&ch===h))bottom=label(132,137,`花区 ${cw} × ${ch}`);
 }else if(['rectangle','cut'].includes(d.kind)){
  art='<rect class="competition-shape" x="70" y="30" width="130" height="70"/>'+(d.kind==='cut'?'<rect class="competition-fill" x="70" y="82" width="130" height="18"/>':'')+label(135,22,labels[0])+label(215,70,labels[1],'start');bottom=label(135,133,labels[2]||'示意图');
 }else if(['triangle','right'].includes(d.kind)){
  art='<path class="competition-shape" d="M70 105 L70 28 L202 105 Z"/>'+(d.kind==='right'?'<path class="competition-line" d="M70 92 L83 92 L83 105"/>':'')+label(63,70,labels[0]||'','end')+label(135,125,labels[1]||'')+label(150,53,labels[2]||'');bottom=labels[3]?label(215,132,labels[3]):'';
 }else if(d.kind==='similar'){
  art='<path class="competition-shape" d="M30 85 L30 47 L92 85 Z M143 100 L143 24 L267 100 Z"/>'+label(48,104,labels[0])+label(195,120,labels[1])+label(66,53,labels[2])+label(202,52,labels[3]);
 }else if(d.kind==='circle'){
  art='<circle class="competition-shape" cx="135" cy="66" r="43"/><path class="competition-line" d="M135 66 H178"/>'+label(135,129,labels[0]);
 }else if(d.kind==='cuboid'){
  art='<path class="competition-shape" d="M91 27 L161 27 L193 10 L123 10 Z M91 27 V77 H161 V27 M161 77 L193 60 V10"/>'+label(142,98,labels[0])+label(142,121,labels[1])+label(142,145,labels[2]);
 }else if(d.kind==='coordinate'){
  const maxX=d.x+d.dx+1,maxY=d.y+d.dy+1,px=x=>35+205*x/maxX,py=y=>110-90*y/maxY;
  art='<path class="competition-line" d="M35 14 V110 H252"/>';
  for(let x=0;x<=maxX;x++)art+=`<path class="competition-grid-line" d="M${px(x)} 20 V110"/>`;
  for(let y=0;y<=maxY;y++)art+=`<path class="competition-grid-line" d="M35 ${py(y)} H240"/>`;
  art+=`<path class="competition-line" d="M${px(d.x)} ${py(d.y)} L${px(d.x+d.dx)} ${py(d.y+d.dy)}"/><circle class="competition-dot" cx="${px(d.x)}" cy="${py(d.y)}" r="4"/><circle class="competition-dot" cx="${px(d.x+d.dx)}" cy="${py(d.y+d.dy)}" r="4"/>`+label(px(d.x),py(d.y)+17,'A')+label(px(d.x+d.dx)-6,py(d.y+d.dy)-6,'B')+label(247,130,'x')+label(18,18,'y');
 }else if(d.kind==='sets'){
  art='<ellipse class="competition-shape" cx="111" cy="60" rx="49" ry="37"/><ellipse class="competition-shape" cx="168" cy="60" rx="49" ry="37"/>'+label(83,64,labels[0])+label(195,64,labels[1]);bottom=label(135,125,labels[2]);
 }else if(['strip','ratio'].includes(d.kind)){
  const parts=d.parts||4;
  for(let i=0;i<parts;i++)art+=`<rect class="${i<(d.filled??1)?'competition-fill':'competition-shape'}" x="${35+210*i/parts}" y="38" width="${210/parts}" height="38"/>`;
  art+=label(140,24,labels[0]);bottom=label(140,112,labels[1]);
 }else if(d.kind==='mirror'){
  art='<path class="competition-grid-line" d="M135 15 V103"/><path class="competition-shape" d="M65 50 L73 34 L81 50 L98 53 L85 67 L89 84 L73 76 L57 84 L61 67 L48 53 Z M205 50 L197 34 L189 50 L172 53 L185 67 L181 84 L197 76 L213 84 L209 67 L222 53 Z"/>'+label(67,124,labels[0])+label(205,124,labels[2]);
 }else if(d.kind==='chart'){
  art='<path class="competition-line" d="M60 15 V111 H215"/><rect class="competition-shape" x="111" y="24" width="48" height="87"/>';
  for(let i=0;i<5;i++)art+=`<path class="competition-grid-line" d="M56 ${111-21*i} H215"/>`+label(46,115-21*i,String(i*(d.step||1)),'end');
  art+='<path class="competition-line" d="M110 34 L160 45 M110 45 L160 56"/>'+label(174,23,'n 格');bottom=label(135,136,`每格 ${d.step} 张（省略中段）`);
 }else if(d.kind==='table'){
  return `<div class="competition-material-table"><table><tbody>${d.rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 }else if(d.kind==='balls'&&Number.isInteger(d.red)){
  for(let i=0;i<d.red+d.blue;i++)art+=`<circle class="${i<d.red?'competition-fill':'competition-shape'}" cx="${47+(i%8)*26}" cy="${35+Math.floor(i/8)*31}" r="10"/>`;
  bottom=label(140,131,labels.join(' · '));
 }else{
  art=labels.map((v,i)=>label(140,28+i*31,v)).join('');
 }
 const description=labels.length?labels.join('，'):d.kind==='garden'?`长 ${d.width}，宽 ${d.height}，${d.cutWidth?'角落花区长 '+d.cutWidth+'，宽 '+d.cutHeight:'长方形地面'}`:d.kind==='coordinate'?'点 A 和 B 的坐标图':d.kind==='hypotenuseMidpoint'?`直角边长 ${3*d.k} 与 ${4*d.k}，M为${d.legMidpoint?'较长直角边':'斜边'}中点，虚线是所求距离`:d.kind==='boxNet'?`边长 ${d.side} 的正方形纸，四角各剪去边长${d.cut||'x'}的小正方形，虚线为折叠位置${d.cut?'':'，x是待选长度'}`:d.kind==='angleRatioTriangle'?`三个内角按顶点标注比例 ${d.ratios.join(':')}，示意图不按角度比例绘制`:d.kind==='truncatedBars'?`纵轴从 ${d.base} 人起，每个小格 ${d.step} 人，甲高 ${d.a} 格，乙高 ${d.b} 格`:'题目中的数学示意图';
 const schematic=['rectangleDiagonal','notch','lShape','cross','parallelTriangle','fourAreas','isoscelesExterior','angleRatioTriangle'].includes(d.kind);
 return `<figure class="competition-geometry"><svg class="competition-diagram" viewBox="0 0 285 150" role="img" aria-label="${esc(description)}">${art}${bottom}</svg>${d.caption||schematic?`<figcaption>${esc(d.caption||'')}${schematic?' 示意图，尺寸或角度以标注为准。':''}</figcaption>`:''}</figure>`;
}
function competitionRelationDiagram(d){
 const title=d.title||'数量关系';
 if(d.kind==='rule-table'||d.kind==='rule-candidates')return `<figure class="rule-figure"><figcaption>${esc(title)}</figcaption><div class="rule-table-scroll"><table aria-label="${esc(title)}">${d.headers?`<thead><tr>${d.headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead>`:''}<tbody>${(d.rows||[]).map(row=>`<tr>${row.map((x,i)=>i===0?`<th scope="row">${esc(x)}</th>`:`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></figure>`;
 if(d.kind==='rule-bars'){
  const max=Math.max(1,...d.rows.map(row=>row.parts.reduce((s,p)=>s+Math.max(0,p.size),0)));
  return `<figure class="rule-figure"><figcaption>${esc(title)}</figcaption>${d.rows.map(row=>`<div class="rule-bar-row"><b>${esc(row.label)}</b><div class="rule-bar-track" aria-hidden="true">${row.parts.map(p=>`<span class="rule-bar ${p.role==='change'?'rule-change':''}" style="width:${Math.max(0,p.size)/max*100}%"></span>`).join('')}</div><p>${row.parts.map(p=>esc(p.caption)).join(' ＋ ')}</p></div>`).join('')}</figure>`;
 }
 if(d.kind==='rule-links'){
  const n=d.n,px=i=>32+296*i/(n-1);let art='';
  for(let i=0;i<n;i++){art+=`<rect x="${px(i)-14}" y="30" width="28" height="28" rx="5"/><text x="${px(i)}" y="48" text-anchor="middle">${i+1}</text>`;if(i<n-1){const mid=(px(i)+px(i+1))/2;art+=`<path d="M${px(i)+14} 44 H${px(i+1)-14}"/><rect class="rule-joint" x="${mid-4}" y="40" width="8" height="8"/>`}}
  if(d.closed)art+='<path d="M328 58 V92 H32 V58"/><rect class="rule-joint" x="176" y="88" width="8" height="8"/>';
  return `<figure class="rule-figure"><svg class="rule-svg" viewBox="0 0 360 115" role="img" aria-label="${n}段${d.closed?'首尾相接':'排成长条'}的连接示意">${art}</svg><figcaption>${esc(d.caption)} 图只表示连接关系。</figcaption></figure>`;
 }
 if(d.kind==='rule-border'){
  const outer=d.n+2,size=120/outer;let art='';for(let y=0;y<outer;y++)for(let x=0;x<outer;x++){const border=x===0||y===0||x===outer-1||y===outer-1,topBottom=y===0||y===outer-1;art+=`<rect class="${border?'rule-new-cell':'rule-old-cell'}" ${d.focus==='sides'&&topBottom?'style="fill:var(--blue)"':''} opacity="${['added','sides'].includes(d.focus)&&!border?0.22:1}" x="${72+x*size}" y="${8+y*size}" width="${size}" height="${size}"/>`}
  return `<figure class="rule-figure"><svg class="rule-svg" viewBox="0 0 265 146" role="img" aria-label="原有${d.n}乘${d.n}方阵，周围新增一圈">${art}<text x="132" y="142" text-anchor="middle">中间：原有 ${d.n} × ${d.n}；外圈：新增</text></svg><figcaption>${esc(d.title)}</figcaption></figure>`;
 }
 return '';
}
function competitionHintPanel(c,state,history){
 if(!history.hinted)return '';const level=Math.max(1,Math.min(c.hints.length,state.hintLevel||1));
 return `<div class="competition-hint">${c.hints.slice(0,level).map(t=>`<p role="status">${esc(t)}</p>`).join('')}${level>1?competitionDiagram(c.hintDiagram):''}<div class="competition-hint-controls"><button class="secondary" data-action="competitionReadHint" aria-label="朗读当前提示">🔊 听提示</button><button class="secondary" data-action="competitionStopSpeech">停止朗读</button>${level<c.hints.length?'<button class="secondary" data-action="competitionHintMore">再给一个方向</button>':''}</div></div>`;
}
function competitionStopCurrentSpeech(){speechSequence++;if('speechSynthesis' in window)try{window.speechSynthesis.cancel()}catch{}speechMessage=''}
function competitionClues(task){const c=task.competition;return c.clues?`<div class="competition-clues">${c.clues.map((clue,i)=>`<section class="competition-clue"><div class="competition-clue-label">条件 ${i+1} · ${esc(topicNames([clue.topicId]))}<button class="read-mini" data-action="competitionReadClue" data-index="${i}" aria-label="朗读条件 ${i+1}">🔊</button></div><p>${esc(clue.text)}</p>${competitionDiagram(clue.diagram)}</section>`).join('')}</div>`:competitionDiagram(c.diagram)}
function competitionSolutions(task){
 const c=task.competition,state=competitionState();if(!c.methods[state.method])state.method=0;const method=c.methods[state.method];state.step=Math.max(0,Math.min(state.step||0,method.steps.length-1));
 const table=state.method===1&&c.verification?`<div class="competition-material-table"><table aria-label="每个选项代入全部条件"><thead><tr><th>号码</th>${c.clues.map((_,i)=>`<th>条件 ${i+1}</th>`).join('')}</tr></thead><tbody>${c.verification.map(row=>`<tr><td>${row.number}</td>${row.checks.map(check=>`<td>${esc(check.value)} ${check.ok?'✓':'×'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'';
 return `<section class="competition-solutions"><h2>${c.methods.length>1?'比较解题路线':'看看解题思路'}</h2><div class="competition-methods">${c.methods.map((m,i)=>`<button class="secondary" data-action="competitionMethod" data-index="${i}" aria-pressed="${state.method===i}">${esc(m.name)}</button>`).join('')}</div>${competitionDiagram(method.frames?.[state.step])}<ol>${method.steps.map((text,i)=>`<li class="${method.frames&&state.step===i?'rule-active-step':''}">${method.frames?`<button class="rule-step secondary" data-action="competitionStep" data-index="${i}" aria-pressed="${state.step===i}" aria-label="查看第 ${i+1} 步的关系图">看这一步</button> `:''}${esc(text)} <button class="read-mini" data-action="competitionReadStep" data-index="${i}" aria-label="朗读这一步">🔊</button></li>`).join('')}</ol>${table}<details class="competition-extension"${state.extensionResult?' open':''}><summary>条件变了，还能用原来的办法吗？</summary><p>${esc(c.extension.prompt)} <button class="read-mini" data-action="competitionReadExtension" aria-label="朗读变式">🔊</button></p>${competitionDiagram(c.extension.diagram)}<div class="competition-extension-input"><label>答案 <input data-competition-input="extension" inputmode="decimal" autocomplete="off" value="${esc(state.extensionInput)}" placeholder="整数、小数或分数"></label><button class="secondary" data-action="competitionExtensionCheck">检查变式</button></div>${state.extensionResult?.ok?competitionDiagram(c.extension.solutionFrames?.at(-1)):''}${state.extensionResult?`<p role="status">${state.extensionResult.ok?'✓ '+esc(c.extension.solution):'再核对改变的是哪条条件。'}</p>`:''}</details></section>`;
}
function competitionQuestionPage(){
 const session=topicSession(),item=topicCurrent(),task=playerTask();if(!session||!item||!task?.competition)return topicSelectionPage();
 const c=task.competition,state=competitionState(),history=competitionHistory(task);
 return `<section class="topic-question competition-question"><div class="page-head"><div><p class="kicker">第 ${session.cursor+1} / ${session.total} 题 · ${c.level?['','起步','进阶','挑战'][c.level]:'思路挑战'}</p><h1>${esc(c.title||topicNames(c.topicIds))}</h1>${item.passed?`<p class="competition-topic-label">本题用到：${esc(topicNames(c.topicIds))}</p>`:''}</div><button class="back" data-action="topicExit">← 换主题</button></div><div class="topic-question-nav"><button class="secondary" data-action="topicPrevious" ${session.cursor?'':'disabled'}>← 上一题</button><span role="status">${item.passed?'答对了，可以比较解法或继续':'找关键关系，试试更简洁的解法'}</span></div><article class="panel topic-question-work"><h2 class="task-title">${esc(task.prompt)} <button class="read-mini" data-action="competitionRead" aria-label="朗读题目及图表条件">🔊</button></h2>${competitionClues(task)}<div class="competition-options" role="group" aria-label="选答案">${displayOrder(task,'options').map(i=>`<div class="competition-option"><button class="${draft.choice===i?'primary':'secondary'}" data-action="competitionPick" data-index="${i}" aria-pressed="${draft.choice===i}" ${item.passed?'disabled':''}>${esc(task.options[i])}</button><button class="competition-cross secondary" data-action="competitionEliminate" data-index="${i}" aria-label="${state.eliminated.includes(i)?'恢复':'划掉'}选项 ${esc(task.options[i])}" aria-pressed="${state.eliminated.includes(i)}" ${item.passed?'disabled':''}>${state.eliminated.includes(i)?'已划掉':'划掉'}</button><button class="read-mini" data-action="competitionReadOption" data-index="${i}" aria-label="朗读选项 ${esc(task.options[i])}">🔊</button></div>`).join('')}</div><details class="competition-notes"><summary>记下我的思路</summary><textarea data-competition-input="notes" maxlength="1200" aria-label="我的解题思路" placeholder="可以记算式，也可以在纸上画图。">${esc(state.notes)}</textarea></details>${feedback?`<p class="feedback ${feedback.ok?'ok':'retry'}" role="status">${esc(feedback.text)}</p>`:''}<div id="speech-status" class="tiny-note" role="status" aria-live="polite">${esc(speechMessage)}</div><div class="competition-actions"><button class="primary" data-action="${item.passed?'next':'check'}">${item.passed?'下一题 →':'提交答案 ✓'}</button>${!item.passed?'<button class="secondary" data-action="competitionHint">给我一个方向</button>':''}</div>${!item.passed?competitionHintPanel(c,state,history):''}${item.passed?competitionSolutions(task):''}</article></section>`;
}
function competitionSubmit(){
 const task=playerTask(),item=topicCurrent();if(!topicSessionMatches()||!task?.competition||item.passed)return;
 if(!Number.isInteger(draft.choice)||draft.choice<0||draft.choice>=5){feedback={ok:false,text:'先选一个答案。'};render();return}
 const c=task.competition,history=competitionHistory(task),exposure=CompetitionIdentity.exposure(saved.competition,task),state=competitionState(),ok=draft.choice===task.answer;
 const record={taskId:task.id,contentVersion:task.contentVersion,recipe:c.recipe,signature:c.signature,topicIds:[...c.topicIds],selectedTopicIds:[...topicSession().topicIds],sessionId:topicSession().id,at:Date.now(),order:++saved.competition.sequence,choice:draft.choice,correct:ok,firstCorrect:!exposure.attempted&&!exposure.uncertain&&ok&&!exposure.hinted&&!exposure.solutionViewed,firstAttempt:!exposure.attempted&&!exposure.uncertain,priorSolutionViewed:exposure.solutionViewed,hinted:exposure.hinted,priorExposureUnknown:exposure.uncertain===true,equivalentRepeat:(exposure.attempted||exposure.uncertain)&&!history.attempted,notes:state.notes};
 saved.competition.attempts.push(record);competitionUpdateMainHistory(saved.competition,record);
 saved.competition.attempts=saved.competition.attempts.slice(-500);item.passed=ok;
 feedback={ok,text:ok?(c.methods.length>1?'答对了。可以比较解题路线，再试条件变化。':'答对了。看看关键推理，再试条件变化。'):(c.misconceptions?.find(m=>competitionValueEqual(task.options[draft.choice],m.value))?.feedback||'还没同时满足题目条件。换一种方法核对一下。')};
 if(ok)history.solutionViewed=true;
 persist();render();
}
function competitionHandleInput(target){
 if(view!=='competition'||!playerTask()?.competition||!target.dataset?.competitionInput)return false;
 const state=competitionState();if(target.dataset.competitionInput==='notes')state.notes=String(target.value).slice(0,1200);else if(target.dataset.competitionInput==='extension'){state.extensionInput=String(target.value).slice(0,40);state.extensionResult=null}else return false;
 persist();return true;
}
function competitionHandleAction(action,data){
 if(action==='competitionRecords'){open('competitionRecords');return true}
 const task=playerTask();if(view!=='competition'||!task?.competition)return false;
 const c=task.competition,state=competitionState(),item=topicCurrent(),i=Number(data.index);
 if(action==='check'){competitionSubmit();return true}
 if(action==='competitionPick'){if(!item.passed&&Number.isInteger(i)&&i>=0&&i<5&&!state.eliminated.includes(i)){draft.choice=i;feedback=null;persist();render()}return true}
 if(action==='competitionEliminate'){if(!item.passed&&Number.isInteger(i)&&i>=0&&i<5){const at=state.eliminated.indexOf(i);if(at<0){state.eliminated.push(i);if(draft.choice===i)draft.choice=-1}else state.eliminated.splice(at,1);feedback=null;persist();render()}return true}
 if(action==='competitionHint'||action==='competitionHintMore'){if(!item.passed){competitionStopCurrentSpeech();const h=competitionHistory(task);if(!h.hinted){h.hintedAt=Date.now();h.hintOrder=++saved.competition.sequence}h.hinted=true;CompetitionIdentity.invalidate(saved.competition);state.hintLevel=action==='competitionHintMore'?Math.min(c.hints.length,Math.max(1,state.hintLevel||1)+1):Math.max(1,state.hintLevel||1);persist();render()}return true}
 if(action==='competitionStopSpeech'){
  speechSequence++;if('speechSynthesis' in window)try{window.speechSynthesis.cancel()}catch{}
  setSpeechStatus('朗读已停止。');return true;
 }
 if(action==='competitionMethod'){if(item.passed&&Number.isInteger(i)&&i>=0&&i<c.methods.length){competitionStopCurrentSpeech();state.method=i;state.step=0;persist();render()}return true}
 if(action==='competitionStep'){if(item.passed&&Number.isInteger(i)&&i>=0&&i<c.methods[state.method].steps.length){competitionStopCurrentSpeech();state.step=i;persist();render()}return true}
 if(action==='competitionExtensionCheck'){
  if(item.passed){if(state.extensionResult?.ok)return true;if(!state.extensionInput.trim()){state.extensionResult={ok:false};render();return true}const ok=competitionValueEqual(state.extensionInput,c.extension.answer);state.extensionResult={ok};const variationSignature=competitionVariationSignature(task),key=competitionHash(variationSignature),prior=saved.competition.extensionViews[key],exposure=CompetitionIdentity.exposure(saved.competition,task,'extension'),at=Date.now(),order=++saved.competition.sequence;const independent=!exposure.attempted&&!exposure.uncertain&&!exposure.hinted&&!exposure.solutionViewed;saved.competition.extensions.push({taskId:task.id,recipe:c.recipe,signature:c.signature,variationSignature,firstAttempt:!exposure.attempted&&!exposure.uncertain,priorExposureUnknown:exposure.uncertain===true,hinted:exposure.hinted,priorSolutionViewed:exposure.solutionViewed,at,order,input:state.extensionInput,correct:ok});if(!prior?.attempted)saved.competition.extensionViews[key]={at,order,signature:variationSignature,mainSignature:c.signature,recipe:c.recipe,attempted:true,firstInput:state.extensionInput,firstIndependent:independent,hinted:exposure.hinted,priorSolutionViewed:exposure.solutionViewed,firstCorrect:ok&&independent};if(ok)saved.competition.extensionViews[key].solved=competitionExtensionSnapshot(variationSignature,{recipe:c.recipe,input:state.extensionInput,at});saved.competition.extensions=saved.competition.extensions.slice(-300);CompetitionIdentity.invalidate(saved.competition);persist();render()}return true;
 }
 const speech=action==='competitionRead'?competitionQuestionSpeech(task):action==='competitionReadHint'&&!item.passed&&competitionHistory(task).hinted?c.hints[Math.max(0,Math.min(c.hints.length-1,(state.hintLevel||1)-1))]:action==='competitionReadClue'?c.clues?.[i]?.text:action==='competitionReadOption'?task.options[i]:action==='competitionReadStep'&&item.passed?c.methods[state.method].steps[i]:action==='competitionReadExtension'&&item.passed?c.extension.prompt:null;
 if(action.startsWith('competitionRead')){if(speech)speak('surface',-1,action==='competitionRead'?speech:competitionSpeechText(speech));return true}
 return false;
}
function competitionRecordsPage(){
 const answers=saved.competition.attempts,counts=competitionProgressCounts();
 return `<section class="panel competition-records"><div class="page-head"><h1>竞赛练习记录</h1><button class="back" data-action="home">← 选主题</button></div><p>已记录完成 ${counts.solved} 道不同题，${counts.first} 道未用提示首答正确，完成 ${counts.extensions} 道变式。</p><p>勾选主题表示允许出题；查看解法表示已经看过，不计为掌握了这种方法。</p><ol>${answers.slice(-15).reverse().map(a=>`<li>${esc(topicNames(a.topicIds))} · ${a.correct?'答对':'待再试'}${a.hinted?' · 使用了提示':''}</li>`).join('')||'<li>最近没有答题明细。</li>'}</ol><details><summary>查看原有学习记录</summary><button class="secondary" data-action="progress">打开历史记录</button></details></section>`;
}

'use strict';
// A shared entry point keeps existing route renderers and task identities.
// Adapters continue to own real actions, state, grading and speech.
function practicePlayerPage(){const task=PRACTICE_BANKS[view]?.[microSkillId],node=NODE_BY_ID.get(microSkillId);if(!task||!node)return '<div class="panel">请选择一个操作任务。</div>';return `<div class="page-head"><div><p class="kicker">${task.skillId} · 练</p><h1>${esc(node.concept)}</h1></div><button class="back" data-action="network" data-code="${task.skillId}">← 相关知识</button></div><div class="work"><article class="panel"><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到相关知识 →':'检查操作与理由 ✓'}</button></div>${taskBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack"><section class="panel"><h3>把思路连起来</h3><button class="secondary" data-action="learn" data-code="${task.skillId}">回看概念与条件</button><button class="secondary" data-action="demo" data-code="${task.skillId}">看另一道例子</button><button class="secondary" data-action="network" data-code="${task.skillId}">相关知识与后续新题</button></section></aside></div>`}
const TASK_PLAYERS={
 competition:{page:()=>competitionQuestionPage(),task:()=>topicActive?topicDescriptor(topicCurrent())?.task:null},
 competitionRecords:{page:()=>competitionRecordsPage(),readOnly:true},
 ...Object.fromEntries(Object.keys(PRACTICE_BANKS).map(name=>[name,{page:()=>practicePlayerPage(),task:()=>PRACTICE_BANKS[name][microSkillId]}])),
 joint:{page:()=>jointPage(),task:()=>jointAccess(jointTaskId).allowed?JOINT_TASKS[jointTaskId]:null},
 fruit:{page:()=>fruitPage(),task:()=>FRUIT_TASKS[saved.fruitCursor]},
 course:{page:()=>coursePage(),task:()=>COURSES[courseCode]?.steps[courseRecord(courseCode).cursor]},
 transfer:{page:()=>transferPage(),task:()=>FOCUS_REVIEW[courseCode]?.[reviewRecord(courseCode)?.cursor]},
 sample:{page:()=>samplePage(),task:()=>SAMPLE_TASKS[sampleCode]},
 stage:{page:()=>stagePage(),task:()=>stageAccess(stageSkillId,stageKind).allowed?STAGED_TASKS[stageSkillId]?.[stageKind]:null},
 micro:{page:()=>microPage(),task:()=>MICRO_TASKS[microSkillId]},
 learn:{page:()=>learningPage(),task:()=>LEARNING_TASKS[microSkillId],readOnly:true},
 demo:{page:()=>demoPage(),task:()=>DEMO_TASKS[demoSkillId],readOnly:true},
 network:{page:()=>networkPage(),task:()=>LEARNING_TASKS[networkSkillId],readOnly:true},
 catalog:{page:()=>catalogPageHtml(),readOnly:true},progress:{page:()=>progressPage(),readOnly:true},skillMap:{page:()=>skillMapPage(),readOnly:true},
 knowledge:{page:()=>knowledgeHome(),readOnly:true},topicSummary:{page:()=>topicSummaryPage(),readOnly:true}
};
function playerPage(){if(topicSessionMatches())return competitionQuestionPage();return TASK_PLAYERS[view]?.page()||home()}
function playerTask(){return TASK_PLAYERS[view]?.task?.()||null}

'use strict';
let topicActive=false,topicOpening=false;
function topicIds(ids){const chosen=new Set(Array.isArray(ids)?ids:[]);return SKILL_DATA.units.filter(u=>chosen.has(u.id)).map(u=>u.id)}
function topicTaskKey(task){return taskVersion(task)+':'+task.id}
function topicTaskRegions(task){if(task.competition)return [...task.competition.topicIds];const ids=task.joint?[...task.joint.targetNodeIds,...task.joint.supportNodeIds]:[task.skillId];return [...new Set(ids.map(id=>NODE_BY_ID.get(id)?.regionId).filter(Boolean))]}
function topicDescriptor(item){
 if(item?.view!=='competition')return null;
 try{const task=competitionCreate(item.recipe);return {view:'competition',code:task.id,task}}catch{return null}
}
function topicRestoreDraft(value){
 const restored=freshDraft();if(!value||typeof value!=='object')return restored;
 if(Number.isInteger(value.choice)&&value.choice>=-1&&value.choice<5)restored.choice=value.choice;
 if(Number.isFinite(value.startedAt)&&value.startedAt>0)restored.startedAt=value.startedAt;
 restored.work=competitionRestoreWork(value.work);if(restored.work.eliminated.includes(restored.choice))restored.choice=-1;return restored;
}
function topicRestoreState(old){
 const state={selectedTopicIds:topicIds(old?.selectedTopicIds),session:null,nextSeed:Number.isInteger(old?.nextSeed)&&old.nextSeed>0&&old.nextSeed<=2147483647?old.nextSeed:1,legacySession:null};
 const source=old?.session;
 // Preserve the old navigation snapshot without resuming isolated lessons.
 const legacy=source&&source.mode!=='competition-v2'?source:old?.legacySession;
 if(legacy&&typeof legacy==='object'&&JSON.stringify(legacy).length<500000)state.legacySession=legacy;
 if(source?.mode!=='competition-v2')return state;
 const ids=topicIds(source.topicIds);if(!ids.length||!Array.isArray(source.items)||!source.items.length||source.items.length>66)return state;
 const items=[],signatures=new Set();
 for(const row of source.items){
  const d=topicDescriptor(row),task=d?.task,c=task?.competition;
  if(!task||![2,3].includes(c.recipe.engine)||row.taskId!==task.id||row.code!==task.id||row.contentVersion!==task.contentVersion||!Number.isFinite(row.openedAt)||row.openedAt<=0||!c.topicIds.every(id=>ids.includes(id))||signatures.has(c.signature))return state;
  signatures.add(c.signature);
  const solved=saved.competition.views[competitionHash(c.signature)]?.solved;
  const passed=solved?.correct===true&&solved.sessionId===source.id&&solved.at>=row.openedAt||saved.competition.attempts.some(a=>a.signature===c.signature&&a.sessionId===source.id&&a.correct&&a.at>=row.openedAt);
  const restoredDraft=topicRestoreDraft(row.draft),wrong=row.feedback?.ok===false&&restoredDraft.choice>=0&&restoredDraft.choice!==task.answer;
  items.push({view:'competition',code:task.id,taskId:task.id,contentVersion:task.contentVersion,recipe:c.recipe,openedAt:row.openedAt,passed,draft:restoredDraft,feedback:passed?{ok:true,text:'这题已经答对，可以比较解法或继续。'}:wrong?{ok:false,text:c.misconceptions?.find(m=>competitionValueEqual(task.options[restoredDraft.choice],m.value))?.feedback||'还没同时满足题目条件。换一种方法核对一下。'}:null});
 }
 const first=items.findIndex(i=>!i.passed),limit=first<0?items.length-1:first;
 state.session={mode:'competition-v2',id:typeof source.id==='string'?source.id.slice(0,100):'restored',topicIds:ids,planSeed:Number.isInteger(source.planSeed)&&source.planSeed>0?source.planSeed:1,total:Math.max(items.length,Math.min(66,Number.isInteger(source.total)?source.total:10)),cursor:Math.max(0,Math.min(limit,Number.isInteger(source.cursor)?source.cursor:limit)),items,exhausted:source.exhausted===true};return state;
}
function topicSession(){return saved.topicPractice?.session||null}
function topicCurrent(){const s=topicSession();return s?.items[s.cursor]||null}
function topicFrontier(){const s=topicSession();if(!s)return 0;const i=s.items.findIndex(row=>!row.passed);return i<0?s.items.length:i}
function topicSessionMatches(){const item=topicCurrent();return !!topicActive&&view==='competition'&&!!item&&item.view===view&&!!topicDescriptor(item)}
function topicCaptureDraft(){if(topicOpening||!topicSessionMatches())return;const item=topicCurrent();item.draft=JSON.parse(JSON.stringify(draft));item.feedback=feedback?{ok:feedback.ok===true,text:String(feedback.text||'')}:null}
function topicPickNext(session){
 const tasks=session.items.map(row=>topicDescriptor(row).task),used=new Set(tasks.map(t=>CompetitionIdentity.key(t))),seen=new Set([...CompetitionIdentity.index(saved.competition).values()].filter(h=>h.attempted||h.hinted||h.solutionViewed).map(h=>h.key));
 // Prefer different problem structures and perspectives. No topic quotas.
 const profile=competitionAdaptiveProfile(saved.competition.attempts,saved.competition.extensions,session.topicIds,saved.competition.extensionViews,saved.competition.views);
 const families=competitionShuffle(competitionReviewedEligible(session.topicIds),competitionRng(session.planSeed+session.items.length));
 const byId=new Map(COMPETITION_REVIEWED.map(f=>[f.id,f])),history=[],historyMath=new Set(used);
 const activity=Object.values(saved.competition.views).filter(h=>h.last).map(h=>({...h.last,signature:h.signature})).concat(saved.competition.attempts).sort((a,b)=>b.at-a.at||(b.order||0)-(a.order||0));
 for(const a of activity){
  const f=byId.get(a.recipe?.familyId);let key;try{const t=competitionCreate(a.recipe);if(t.competition.signature!==a.signature)continue;key=CompetitionIdentity.key(t)}catch{continue}if(!f||historyMath.has(key)||!f.topicIds.every(id=>session.topicIds.includes(id)))continue;
  historyMath.add(key);history.unshift(f);if(history.length===12)break;
 }
 const trail=history.concat(tasks.map(t=>byId.get(t.competition.recipe.familyId)).filter(Boolean));
 const score=f=>{
  const target=competitionAdaptiveTarget(profile,f),count=tasks.filter(t=>t.competition.recipe.familyId===f.id).length;
  let streak=0;for(let i=trail.length-1;i>=0&&trail[i].id===f.id;i--)streak++;
  const canChange=families.some(g=>g.id!==f.id&&g.level<=competitionAdaptiveTarget(profile,g).level);
  // Keep a short reinforcing pair, then prefer another legal perspective.
  // A narrow low-band pool may repeat rather than force a harder question.
  const stayLow=target.band===1&&!target.probe&&f.level>target.level&&families.some(g=>g.level<=competitionAdaptiveTarget(profile,g).level);
  const reasoning=f.selectionReasoningKey||f.reasoningKey||f.strategy,reasoningCount=trail.filter(g=>(g.selectionReasoningKey||g.reasoningKey||g.strategy)===reasoning).length;
  let reasoningStreak=0;for(let i=trail.length-1;i>=0&&(trail[i].selectionReasoningKey||trail[i].reasoningKey||trail[i].strategy)===reasoning;i--)reasoningStreak++;
  const canChangeReasoning=families.some(g=>(g.selectionReasoningKey||g.reasoningKey||g.strategy)!==reasoning&&g.level<=competitionAdaptiveTarget(profile,g).level),loads=CompetitionDesign.familyLoads(f);
  return Math.abs(f.level-target.level)*80+(f.level>target.level?80*(f.level-target.level):0)+(stayLow?10000:0)+count*60+history.filter(g=>g.id===f.id).length*12+reasoningCount*8+(streak>=2&&canChange?100:0)+(reasoningStreak>=2&&canChangeReasoning?180:0)+loads.calculationLoad.level*5+loads.readingLoad.level*3+(f.topicIds.length>1?-4:0);
 };
 families.sort((a,b)=>score(a)-score(b));let repeated=null;
 for(const family of families){
  const candidates=[];
  for(let tries=0;tries<120;tries++){
   const seed=saved.topicPractice.nextSeed;saved.topicPractice.nextSeed=seed>=2147483647?1:seed+1;
   const task=competitionCreate(competitionReviewedRecipe(family.id,seed)),signature=task.competition.signature,mathKey=CompetitionIdentity.key(task);if(used.has(mathKey))continue;
   const item={view:'competition',code:task.id,taskId:task.id,contentVersion:task.contentVersion,recipe:task.competition.recipe,openedAt:Date.now(),passed:false,draft:null,feedback:null};
   candidates.push({item,score:CompetitionDesign.comfort(task.competition),seen:seen.has(mathKey)});
   if(candidates.filter(c=>!c.seen).length>=12)break;
  }
  candidates.sort((a,b)=>Number(a.seen)-Number(b.seen)||a.score-b.score);
  if(candidates.some(c=>!c.seen))return candidates.find(c=>!c.seen).item;
  repeated??=candidates[0]?.item||null;
 }
 return repeated;
}
function topicOpenCurrent(){
 const item=topicCurrent();if(!item||!topicDescriptor(item))return;
 const previousDraft=item.draft,previousFeedback=item.feedback;topicActive=true;topicOpening=true;
 try{open('competition',item.code);draft=topicRestoreDraft(previousDraft);feedback=item.passed?{ok:true,text:previousFeedback?.text||'这题已经答对，可以比较解法或继续。'}:previousFeedback?.ok===false?previousFeedback:null}finally{topicOpening=false}
 render();window.scrollTo({top:0,behavior:'instant'});
}
function topicFinish(){topicActive=true;topicOpening=true;try{open('topicSummary')}finally{topicOpening=false}persist()}
function topicAdvance(){
 const s=topicSession();if(!s||!topicCurrent()?.passed)return;topicCaptureDraft();
 if(s.cursor+1<s.items.length){s.cursor++;topicOpenCurrent();return}
 if(s.items.length>=s.total||s.exhausted){topicFinish();return}
 const next=topicPickNext(s);if(!next){s.exhausted=true;topicFinish();return}s.items.push(next);s.cursor++;topicOpenCurrent();
}
function topicStart(){
 const ids=topicIds(view==='topicSummary'?topicSession()?.topicIds:saved.topicPractice.selectedTopicIds);if(!ids.length)return;
 saved.topicPractice.selectedTopicIds=[...ids];const s={mode:'competition-v2',id:Date.now()+'-'+Math.random().toString(36).slice(2,8),topicIds:ids,planSeed:saved.topicPractice.nextSeed,total:10,cursor:0,items:[],exhausted:false};
 const first=topicPickNext(s);if(!first)return;s.items.push(first);saved.topicPractice.session=s;topicOpenCurrent();
}
function topicResume(){const s=topicSession();if(!s)return;const frontier=topicFrontier();s.cursor=Math.min(frontier,s.items.length-1);if(frontier===s.items.length){topicAdvance();return}topicOpenCurrent()}
function topicNames(ids){return ids.map(id=>SKILL_DATA.units.find(u=>u.id===id)?.title||id).join('、')}
function topicSelectionPage(){
 const selected=topicIds(saved.topicPractice.selectedTopicIds),session=topicSession(),unfinished=session&&(topicFrontier()<session.items.length||session.items.length<session.total&&!session.exhausted);
 return `<section class="topic-selection"><div class="topic-intro"><h1>今天想练什么？</h1><p>选中的主题默认已经会。在这个范围内做竞赛题，按题目需要自然综合。</p></div><div class="topic-start"><div class="topic-selection-status" role="status" aria-live="polite">${selected.length?'已选 '+selected.length+' 个主题：'+esc(topicNames(selected)):'先点选下面的主题'}</div><div class="topic-start-actions"><button class="primary" data-action="topicStart" ${selected.length?'':'disabled'}>开始做题 →</button>${selected.length?'<button class="secondary" data-action="topicClear">清空选择</button>':''}</div></div>${unfinished?`<section class="topic-resume"><div><b>上次的挑战</b><p>${esc(topicNames(session.topicIds))} · 已完成 ${session.items.filter(i=>i.passed).length}/${session.total} 题</p></div><button class="secondary" data-action="topicResume">继续上次 →</button></section>`:''}<div class="topic-groups">${FAMILIES.map(([prefix,name,icon])=>`<section class="topic-group"><h2><span aria-hidden="true">${icon}</span> ${name}</h2><div class="topic-choices">${SKILL_DATA.units.filter(u=>u.id.startsWith(prefix)).map(u=>`<button class="topic-choice" type="button" data-action="topicSelect" data-code="${u.id}" aria-pressed="${selected.includes(u.id)}"><span>${esc(u.title)}</span><span class="topic-selected-mark" aria-hidden="true">${selected.includes(u.id)?'✓':'＋'}</span></button>`).join('')}</div></section>`).join('')}</div><div class="topic-footer-actions"><span>${selected.length?'出题范围：'+selected.length+' 个主题 · 一组 10 题':'选择主题后开始'}</span><button class="primary" data-action="topicStart" ${selected.length?'':'disabled'}>开始做题 →</button></div><details class="panel topic-parent"><summary>家长查看</summary><div class="stage-buttons"><button class="secondary" data-action="competitionRecords">竞赛练习记录</button><button class="secondary" data-action="knowledge">知识地图与联系</button><button class="secondary" data-action="catalog">历年题目索引</button></div><p>勾选的是知识范围，每题可用其中一个或几个自然相关的主题。不要求每题用完所选主题，也不强求一组全部覆盖。题目重在关键推理、巧解和条件变化，直接开始，原有学习记录保留。</p></details></section>`;
}
function topicSummaryPage(){
 const s=topicSession();if(!s)return topicSelectionPage();const completed=s.items.filter(i=>i.passed).length,firstKeys=new Set();for(const row of s.items){const t=topicDescriptor(row).task,g=CompetitionIdentity.exposure(saved.competition,t),h=g.first;if(g.cleanFirst&&h?.kind==='main'&&h.sessionId===s.id&&h.at>=row.openedAt)firstKeys.add(g.key)}const first=firstKeys.size;
 return `<section class="panel completed topic-summary"><div class="award" aria-hidden="true">✓</div><h1>${s.exhausted?'这个范围的新题暂时做完了':'这组挑战完成了'}</h1><p>${esc(topicNames(s.topicIds))}</p><p>完成 ${completed} 道题，${first} 道未用提示首答正确。</p><div class="hero-cta"><button class="primary" data-action="topicStart">再来一组 →</button><button class="secondary" data-action="topicExit">换主题</button><button class="secondary" data-action="topicPrevious">回看上一题</button></div></section>`;
}
function topicHandleAction(action,data){
 if(action==='topicSelect'){if(view!=='home'||!SKILL_DATA.units.some(u=>u.id===data.code))return true;const chosen=new Set(saved.topicPractice.selectedTopicIds);chosen.has(data.code)?chosen.delete(data.code):chosen.add(data.code);saved.topicPractice.selectedTopicIds=topicIds([...chosen]);persist();render();return true}
 if(action==='topicClear'){if(view==='home'){saved.topicPractice.selectedTopicIds=[];persist();render()}return true}
 if(action==='topicStart'){if(view==='home'||view==='topicSummary')topicStart();return true}
 if(action==='topicResume'){if(view==='home')topicResume();return true}
 if(action==='topicExit'){topicCaptureDraft();topicActive=false;persist();open('home');return true}
 if(action==='topicPrevious'){if(!topicActive||!topicSession())return true;const s=topicSession();topicCaptureDraft();if(view==='topicSummary')s.cursor=s.items.length-1;else if(s.cursor>0)s.cursor--;else return true;topicOpenCurrent();return true}
 if(action==='next'&&topicSessionMatches()){topicAdvance();return true}
 return false;
}

