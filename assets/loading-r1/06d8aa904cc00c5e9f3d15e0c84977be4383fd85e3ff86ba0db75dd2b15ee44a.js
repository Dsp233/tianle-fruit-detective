'use strict';
// RC67: explicit adapters read mathematical data, never reverse-parse a story.
// Presentation is independent of the immutable mathematical recipe version.
const CompetitionDesign=((h,rules,problemState)=>{
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
 define('threeGroupBalance','three-group-reference','用共同参照确定三组人数','改变差额方向、倍数参照或目标','三组正整数，三个条件同时满足');
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

 variation('threeGroupBalance','dependency','差额方向或倍数参照改变，重新连接总量');
 hintPolicy['three-group-reference']='把每条关系连接到总人数；多出的部分属于哪一组？';
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
  const id=f.id,m=c.math,p=m.params||m,v=variation,E=c.extension,state=problemState.create(c,f,v);
  if(c.rc68Diagram)return copy(v?E.rc68Diagram:c.rc68Diagram);
  if(id.startsWith('rule-')){
   const math=v?E.math:m,k=math.variant,a=math.params,context=math.context;
   if(k.startsWith('join-'))return {kind:'scene-join',n:Number(a.n),piece:k==='join-piece'?'?':Number(a.piece),lap:Number(a.lap),closed:k==='join-closed',total:k==='join-piece'?Number(a.total):'?',caption:k==='join-closed'?'首尾闭合；每个连接处只计一次重叠':context==='panels'?'展示板接成长条':'软材料拼接；阴影是重叠部分'};
   if(k.startsWith('posts-'))return {kind:'scene-intervals',distance:Number(a.distance),gap:Number(a.gap),ends:k==='posts-both',draft:true,caption:'先画一个间隔；其余标记由你建立'};
   if(k.startsWith('weighted-'))return units([group('甲',Number(a.a),'人数份',k==='weighted-score'?'?':a.low),group('乙',Number(a.b),'人数份',a.high)],'用比例中的一组作代表；不是实际总人数',{average:k==='weighted-score'?a.mean:'?',object:'person'});
   if(k.startsWith('ratio-'))return {kind:'scene-ratioRectangle',a:Number(a.a),b:Number(a.b),perimeter:k==='ratio-length'?a.perimeter:'?',width:k==='ratio-perimeter'?a.width:null,length:k==='ratio-length'?'?':null,caption:'长与宽同一份；两条长、两条宽组成一周'};
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
   case 'percentRestore':{const p=v&&m.p===100?50:m.p;return strips([row('原价（看作100份）',100,'100 份'),row(v?'先降后的价':'先涨后的价',v?100-p:100+p,(v?100-p:100+p)+' 份')],v?'以降低后的价格为整体，涨回原价100份':'以提高后的价格为整体，降回原价100份',{continuous:true})}
   case 'natural-offers':return {kind:'scene-twoFlows',rows:[{name:'甲店',nodes:[v?'? 本':m.count+' 本',m.price+' 元/本','×75%','+'+m.fee+' 配送']},{name:'乙店',nodes:[v?'? 本':m.count+' 本',m.price-1+' 元/本','免配送']}],caption:v?'求甲总价不高于乙的最少整数本数':'比较同样本数的整单费用'};
   case 'equalDistanceSpeed':return {kind:'scene-journey',segments:[{name:'去',speed:m.speed},{name:'回',speed:2*m.speed}],speedUnit:state.units.speed,equal:v?'time':'distance',caption:v?'去回时间相同':'去回路程相同，时间未必相同'};
   case 'natural-catch':return {kind:'scene-journey',segments:[{name:'小乐',speed:m.slow},{name:'小明',speed:m.fast}],delay:m.delay,afterCatch:v,caption:v?`追上后小明停，小乐再走 ${m.delay} 分钟`:`小乐先走 ${m.delay} 分钟，小明再出发`};
   case 'riverTravel':return {kind:'scene-journey',segments:[{name:'顺流',speed:v?m.v:'?'},{name:'逆流',speed:v?m.v:'?'}],distance:m.distance,equal:'distance',caption:v?'取消水流，静水速度 '+m.v+' 千米/时':'已知静水 '+m.v+'，水流 '+m.c+' 千米/时；实际行驶速度由你推导'};
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
   case 'natural-digitCount':case 'natural-distinctDigitCount':return {kind:'scene-choices',values:m.digits,places:2,repeat:state.projection.repeat,caption:'十位与个位有序；数字和须被3整除'};
   case 'digitComplement':return slots(items(m.length,`0…9`),v?`恰好一位 ${m.digit}`:`至少一位 ${m.digit}`,{positions:true});
   case 'differentDigits':return slots([`1…${m.digits}`,`1…${m.digits}`],v?'两位不同；交换顺序合为同一个':'两位必须不同；顺序不同算不同',{positions:true,exchangeEquivalent:v});
   case 'digitDivisor':return slots([m.tens,v?'0…9':'1…9'],'个位作除数'+(v?'：0能作除数吗？':''),{positions:true});
   case 'pairedSum':return strips([row(v?'只取偶数':'连续整数',m.n,`1、2、…、${m.n}`),row('反向排列',m.n,`${m.n}、…、2、1`)],'对应位置配对',{pairing:true});
   case 'telescopingDifferences':{const first=m.start+(v?m.step:0),left=m.start+2*m.step,right=m.start+(m.n-1)*m.step;return timeline([...new Set([first,...(!v?[m.start+m.step]:[]),left,right,m.start+m.n*m.step])].sort((a,b)=>a-b),'只标题目给出的端点，中间项仍省略',{omittedInterval:right>left+m.step?[left,right]:null})};
   case 'neighborProducts':return {kind:'scene-product',n:m.n,delta:v?2:1,caption:'比较 n×n 与 (n−d)×(n+d)，方格只表示对应关系'};
   case 'signedProduct':return slots([-4*m.k,-3*m.k,-m.k,0,2*m.k,5*m.k],v?'任选2张，先比较符号':'任选3张，先比较符号',{positions:false,choose:v?2:3});
   case 'squareBounds':return {kind:'scene-squareBounds',n:m.n,upper:v,caption:'找相邻整数的平方夹住这个数；边界整数未知'};
   case 'consecutiveRepresentations':return strips([row('连续数',5,v?'a≥0':'a≥1')],`总和 ${m.total}；至少2项；首项、项数都未知`,{sequence:true});
   case 'recurrenceForward':case 'recurrenceTotal':case 'recurrenceBackwards':case 'recurrenceRemainders':{let a=m.a??m.first??(v?2:1),b=m.b??m.second??(v?2:1);if(v&&id==='recurrenceForward')[a,b]=[b,a];const seq=[a,b];while(seq.length<m.n)seq.push(seq.at(-1)+seq.at(-2));return slots(id==='recurrenceBackwards'?['?', '?','…',seq.at(-2),seq.at(-1)]:[a,b,'?','?','…'],`${m.n} 项；从第3项起前两项相加`+(v&&id==='recurrenceBackwards'?'；第1项增加1':v&&id==='recurrenceTotal'?'；只加第2项起':''),{positions:true,positionLabels:state.projection.termIndices,positionUnit:'项'})}
   case 'factorBalance':return {kind:'scene-factorPairs',product:m.product,caption:v?'合法因数对中比较最大和':'合法因数对中比较最小和'};
   case 'threeDivisors':return timeline([1,m.limit],v?'恰好3个因数：找最大合法数':'区间内检查恰好3个因数',{domain:'integer'});
   case 'divisorPowers':return {kind:'scene-exponentGrid',a:m.a,b:m.b,even:v,caption:v?'两个指数都须为偶数':'每个因数由两个指数唯一确定'};
   case 'equalBags':return units([group('红糖',m.a,'颗'),group('蓝糖',m.b,'颗')],v?'比较所有可行袋数':'两色全部用完；每袋两色数量分别相同',{object:'ball',compress:true});
   case 'bells':return {kind:'scene-twoTimelines',periods:[m.a,m.b],start:0,end:v?(m.a*m.b/((a,b)=>{while(b)[a,b]=[b,a%b];return a})(m.a,m.b)):m.duration,includeStart:v,caption:v?'起点和终点都计入':'不算起点，结束时刻计入'};
   case 'offsetBells':return {kind:'scene-twoTimelines',periods:[m.a,m.b],offsets:[0,m.offset],start:0,end:m.a*m.b+m.offset,draft:true,unit:'分钟',caption:v?'用各自周期继续找下一次同时响':'从各自起点按周期标记；不把第0分钟当答案'};
   case 'lastDigit':return flow([{label:'底数',value:m.base},{label:'指数',value:v?`${m.exponent} 与 ${m.exponent+1}`:m.exponent},{label:v?'相邻幂相加个位':'个位',value:'?'}],'寻找从一次方开始的个位循环');
   case 'cyclicPosition':return circle(Array.from({length:m.size},(_,i)=>i+1),`从 ${m.start} 开始，${v?'逆':'顺'}时针 ${m.steps} 步`,{start:m.start,direction:v?-1:1});
   case 'repeatedOnes':return slots(['1','1','…','1'],`${v?m.n+1:m.n} 个1；除以7取余`,{positions:true,positionLabels:['第1位','第2位','…','第'+(v?m.n+1:m.n)+'位']});
   case 'menuBranches':return {kind:'scene-branch',branches:[{label:'米饭',count:m.rice,next:{label:'菜',count:m.dish}},{label:'面',count:m.noodle}],drinks:v?3:null,caption:v?'每份午餐都再配3选1饮料':'米饭配菜，或单独一份面'};
   case 'adjacentLine':return slots(state.projection.line,v?'两人不能相邻；这只是一个合法例子':'两人必须相邻；其余人各不相同',{positions:true,adjacent:state.math.adjacent});
   case 'restrictedTeam':return units([group('小乐',1,'人'),group('小明',1,'人'),{...group('其余人数','?','人'),quantityRole:'target'}],v?'共有'+m.n+'人；小乐小明固定入选，第三人从谁中选择？':'共有'+m.n+'人；选3人，无职位，乐明不能同选',{object:'person'});
   case 'unorderedPairs':return units([group('不同小朋友',m.n,'人')],v?'每对搭档指定角色':'选2人作搭档，不分先后',{object:'person'});
   case 'circularSeating':return circle(items(m.n,'人'),v?'取消相邻限制；旋转合并':'乐明相邻；旋转合并，镜像不合并',{special:['乐','明'],adjacent:!v});
   case 'parityPermutations':return slots(Array.from({length:m.n},(_,i)=>i+1),v?(m.transferConstraint==='first-odd'?'偶数彼此不能相邻，首位必须是奇数':'奇数彼此不能相邻'):'偶数彼此不能相邻',{positions:true});
   case 'binaryNoNeighbors':return slots([v?'●':'○/●',...items(m.n-1,'○/●')],v?'第一盏必须亮；亮灯不能相邻':'每盏亮或灭；亮灯不能相邻',{positions:true});
   case 'allThreeColors':return slots(items(m.n,'红/蓝/绿'),v?'三色中恰好出现两种':'三种颜色都必须出现',{positions:true});
   case 'spinnerLabels':return circle([...items(m.a,'A'),...items(m.b,'B'),...items(m.c,'C')],v?'已知不是C，只在A/B扇区比较':'每个扇区等面积、等机会',{sectors:true,excluded:v?['C']:[]});
   case 'natural-pairChance':case 'conditionalBalls':return units([group('红',m.red,'个'),group('蓝',m.blue,'个')],id==='natural-pairChance'?(v?'每次放回并混合':'不放回取2个，具体球对等可能'):(v?'已知两球颜色相同':'已知至少一个红球'),{object:'ball',sample:2});
   case 'diceSum':return {kind:'scene-diceGrid',faces:m.faces,target:m.target,different:v,caption:v?'只保留两个点数不同的有序对':'行列各对应一枚骰子的实际点数'};
   case 'remainderProbability':return {kind:'scene-remainderCards',mod:m.mod,count:m.count,wanted:m.wanted,includeZero:v,draft:true,caption:'每张卡等可能；分组与尾段由你建立'};
   case 'worstCaseColors':return units(m.caps.map((n,i)=>group(['红','蓝','绿'][i],n,'个')),`不放回；保证 ${m.k+Number(v)} 个同色`,{object:'ball',guarantee:m.k+Number(v)});
   case 'setOutside':case 'exactlyOneSet':case 'natural-unionChance':case 'natural-complementChance':case 'ratioUnion':{const s=state.projection.sets;return {kind:'scene-sets',a:id==='ratioUnion'?m.a+' 份':s.a,b:id==='ratioUnion'?m.b+' 份':s.b,both:s.both,total:s.total??(id==='ratioUnion'?(m.a+m.b)*m.unit-m.both:null),names:id==='ratioUnion'?['棋类组','球类组']:['甲组','乙组'],change:v&&['exactlyOneSet','ratioUnion'].includes(id)?'one-joins-second':v&&id==='setOutside'?'one-outside-joins-both':null,conditional:v&&id.startsWith('natural-'),caption:v?E.prompt:'两组交叠区域属于两组；圈外属于都没参加'}};
   case 'threeSetExactlyTwo':return {kind:'scene-threeSets',ab:m.ab,ac:m.ac,bc:m.bc,triple:m.triple,caption:v?'至少两组：中央三组区域也符合':'恰好两组：每个两组交集都包含中央三组交集'};
   case 'lightSwitchParity':return flow([{label:'开始',value:m.on?'亮':'灭'},{label:'重复按',value:`${m.groups}×${m.per}`},{label:'再按',value:m.extra+(v?1:0)},{label:'最后',value:'?'}],'每次在亮灭之间切换');
   case 'ballReplacement':return {kind:'scene-ballRule',white:m.white+Number(v),black:m.black,caption:'同色→黑；异色→白；每次少一球'};
   case 'quarterTurn':case 'transformOrder':return {kind:'scene-direction',start:m.start,turns:id==='quarterTurn'?m.turns:m.rot,mirror:id==='transformOrder',reverseOrder:v&&id==='transformOrder',anticlockwise:v&&id==='quarterTurn',caption:'上0、右1、下2、左3；按条件顺序追踪'};
   case 'cubeSteps':return {kind:'scene-stairs',n:m.n,depth:v?2:1,caption:`每列 ${v?2:1} 块厚；列高1到 ${m.n}`};
   case 'natural-tiles':{const scale=v?2:1;return {kind:'scene-tiledRectangle',w:m.w*scale,h:m.h*scale,caption:'同规格正方形砖铺满，不切砖；先找最大整数边长'}};
   case 'mapScale':return strips([row('甲地图',m.a,m.a+'厘米'),row('乙地图',m.a*m.k*(v?.5:1),'?')],v?'乙再缩成当前1/2':'乙所有长度为甲的 '+m.k+' 倍',{continuous:true});
   case 'scaleAreaReverse':return flow([{label:'原面积',value:'?'},{label:'长放大',value:m.k+' 倍'},...(v?[]:[{label:'长缩为当前',value:'1/'+m.s}]),{label:'面积',value:v?'?':m.old*m.k*m.k/(m.s*m.s)}],'长度倍率与面积倍率分别追踪');
   case 'oppositeScale':return strips([row('原长',m.a,m.a+'份'),row('新长',m.b,m.b+'份'),row('原宽',m.b,m.old),row('新宽',v?m.b*m.b/m.a:m.a,'?')],v?'长宽使用同一倍率，面积不再固定':'面积不变：宽须使用反向倍率',{continuous:true});
   case 'similarAreaPerimeter':return v?strips([row('小图周长',1,'1份'),row('新图周长',m.b,m.b+'份')],`已知周长倍率 ${m.b}，面积倍率待求`,{continuous:true}):strips([row('小面积',m.a*m.a,m.a*m.a+'份'),row('大面积',m.b*m.b,m.b*m.b+'份')],`小图周长 ${m.a*m.unit}；对应长度比由你推导`,{continuous:true});
   case 'shadowSimilarity':return {kind:'scene-shadows',smallHeight:m.a,smallShadow:v?'?':2*m.a,bigShadow:v?m.b*m.unit:2*m.b*m.unit,bigHeight:v?'原高不变':'?',caption:v?'两杆高度均不变，比较同一时刻的影长变化':'同一时刻、竖直杆、同一阳光方向'};
   case 'ageDifference':return {kind:'scene-age',ago:m.ago,gap:m.parent-m.child,child:v?m.child:'?',parent:v?m.parent:'?',caption:v?'年龄差不变，找未来2倍时刻':`${m.ago} 年前大人是孩子3倍；求孩子现在年龄`};
   default:return geometry(c,f,v);
  }
 }

 function geometry(c,f,v){
  const m=c.math,id=f.id,E=c.extension,d=copy(c.diagram||{});
  if(!v&&id!=='squareBorder'&&d.kind&&!['table','rule-table','line','digits','cuboid','coordinate','sets','meeting','garden','balls','rectangle'].includes(d.kind))return d;
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
  if(generatorRevision>=3){
   const unambiguous=text=>String(text).replace(/÷\s*([-−]?\d+(?:\.\d+)?\/[-−]?\d+(?:\.\d+)?)/g,'÷ ($1)');
   c={...c,methods:c.methods.map(m=>({...m,steps:m.steps.map(unambiguous)})),extension:{...c.extension,solution:unambiguous(c.extension.solution)}};
  }
  const initial=scene(c,f),variation=scene(c,f,true),loads=load(c,f);
  const original=copy(c.math);
  if(!variations[f.id])throw Error('Missing variation value contract '+f.id);
  const variationSpec=generatorRevision>=3?variations[f.id]:{category:'legacy-condition',recheck:config.change};
  const contract={schemaVersion:1,familyId:f.id,modelId:config.model,requiredTopics:[...f.topicIds],goal:config.goal,question:c.prompt,givens:original,constraints:config.constraints,criticalDecision:f.insight,reasoningKey:f.reasoningKey,configurationKey:f.structureKey||f.id,...loads,parameterPolicy:{domain:config.constraints,bounded:true,maxTrials:120,ordinaryScore:'integer',fractionReason:'fraction, ratio, probability, measurement or weighted result'},diagramSpec:{kind:initial.kind,source:'competition.math',stages:['initial','hint','solution','variation'],representationReason:config.model},variationSpec:{change:c.extension.prompt,category:variationSpec.category,decision:variationSpec.recheck,preserved:'未声明变化的原条件',independent:true,newStrategyClaim:false},validation:{oracle:'source/competition_reviewed_oracles.js + RC67 independent overrides',seeds:128}};
  c={...c,...loads,quality:contract,diagram:initial,problemState:problemState.create(c,f),displayRevision:2};
  const familyHints={openBox:['要使体积最大，需要同时知道哪些长度？','剪角长度决定底边和高度，先列合法剪角，再比较体积。'],menuBranches:['两种午餐选择会同时发生，还是只能选一种？','把米饭配菜与单独选面分成互斥分支；新增饮料作用于整份午餐。'],rotatingColors:['旋转后相同的涂法，能否当成两种？','找一个固定参照，检查每个涂法在旋转中重复几次；不是一律除以位置数。'],recurrenceBackwards:['从末尾两个已知数，能得到它们前面的哪个数？','向前是两个相邻数相加，倒推需要使用怎样的逆运算？']};
  c.ruleHints=c.ruleHints||familyHints[f.id]||['要得到题目问的量，还需要哪些条件？先选择一个能确定的中间量。',hintPolicy[config.model]];
  if(!c.ruleHints.every(Boolean))throw Error('Missing hint policy '+f.id);
  c.quality.hintStages=c.ruleHints.map((text,i)=>({level:i+1,text,representation:initial.kind}));
  c.hintDiagram={...copy(initial),stage:{kind:'hint',text:c.ruleHints[1]}};
  c.methods=c.methods.map((method,route)=>({...method,frames:method.steps.map((text,step)=>({kind:'scene-stage',scene:solutionScene(c,f,route,step,initial),stage:{kind:'solution',route,step,text},routeDiagram:method.frames?.[step]||null}))}));
  const solvedVariation=copy(variation);
  if(f.id==='offsetBells')solvedVariation.draft=false;  if(f.id==='restrictedTeam')solvedVariation.groups=[group('小乐',1,'人'),group('小明',1,'人'),group('其余人数',c.math.n-2,'人')];  if(solvedVariation.average==='?')solvedVariation.average=c.extension.answer;
  if(solvedVariation.kind==='scene-fractions'){if(solvedVariation.start==='?'&&solvedVariation.left!=='?')solvedVariation.start=c.extension.answer;else if(solvedVariation.left==='?')solvedVariation.left=c.extension.answer}
  const extension={...c.extension,diagram:variation,problemState:problemState.create(c,f,true),solutionFrames:[{kind:'scene-stage',scene:solvedVariation,stage:{kind:'solution',step:0,text:c.extension.solution}}]};
  if(generatorRevision>=3){
   extension.math=extension.math||{...original,baseFamily:f.id,condition:config.change};
   // Adding a diagram or explicit provenance must not create a new first chance.
   // Only a genuinely changed target/condition supplies a new key in revise().
  }
  c.extension=extension;return c;
 }
 function solutionScene(c,f,route,step,initial){
  const m=c.math;
  if(f.id==='offsetBells')return {...copy(initial),draft:false,caption:'解法回顾：分别按周期列出响铃时刻（分钟）'};
  if(f.id==='restrictedTeam')return {...copy(initial),groups:[group('小乐',1,'人'),group('小明',1,'人'),group('其余人数',m.n-2,'人')],caption:'解法回顾：从总人数扣除两名指定的人'};
  if(f.id==='riverTravel')return {...copy(initial),segments:[{name:'顺流',speed:m.v+m.c},{name:'逆流',speed:step>0?m.v-m.c:'?'}],caption:'按当前解法步骤确认实际速度'};
  if(f.id==='telescopingDifferences')return timeline(Array.from({length:m.n+1},(_,i)=>m.start+i*m.step),'解法回顾：按相邻关系补齐后核对端点');
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
})(typeof module!=='undefined'?require('./competition'):{competitionRng,competitionFraction,competitionNumericOptions},typeof module!=='undefined'?require('./competition_rules'):CompetitionRules,typeof module!=='undefined'?require('./problem_state'):ProblemState);
if(typeof module!=='undefined')module.exports=CompetitionDesign;

'use strict';
// New mathematical configurations use revision 4. Revisions 1--3 stay replayable.
const StructuredRecipes=((h)=>{
 const {competitionRng:rng,competitionNumericOptions:options,competitionFraction:F}=h;
 const M=(name,...steps)=>({name,steps}),copy=x=>JSON.parse(JSON.stringify(x));
 const catalog=[{id:'threeGroupBalance',topicIds:['A02','R01','L01'],level:3,title:'三个小组',strategy:'统一参照与总量',reasoningKey:'three-group-reference',origin:'rc68-original',insight:'选择共同参照，区分均等份和额外量，再检验三个条件',build:seed=>create('threeGroupBalance','main',seed)}];
 const sourceConfigs={overlapAverages:'amc2000-23-full',signedProduct:'amc2000-07-full',digitDivisor:'amc2000-11-full',lShapeArea:'amc2000-06-full'};
 const extraConfigs={parityPermutations:['first-odd-transfer']};
 function minProducts(cards,n){let best=Infinity,plans=[];function walk(start,pick){if(pick.length===n){const product=pick.reduce((a,b)=>a*b,1);if(product<best){best=product;plans=[pick]}else if(product===best)plans.push(pick);return}for(let i=start;i<cards.length;i++)walk(i+1,[...pick,cards[i]])}walk(0,[]);return {best,plans}}
 function groupState(T,d,k,config){
  const direction=config==='change-difference-direction'?-1:1,ref=config==='change-ratio-reference'?'A':'B',goal=config==='change-goal'?'B':'C';
  const B=(T-direction*d*(ref==='A'?k+1:1))/(k+2),A=B+direction*d,C=k*(ref==='A'?A:B);
  if(![T,d,k,A,B,C].every(Number.isSafeInteger)||Math.min(A,B,C)<=0)throw Error('人数条件没有正整数解');
  return {T,d,k,direction,ref,goal,A,B,C,configurationId:config};
 }
 function create(id,config,seed){
  const r=rng(seed);let c;
  if(id==='threeGroupBalance'){
   if(!['main','change-difference-direction','change-ratio-reference','change-goal','invalid-discrete'].includes(config))throw Error('Unknown group configuration');
   if(config==='invalid-discrete')return groupState(55,6,2,config);
   // Even differences and B>d make the direction/reference variations legal.
   let B,d,k,m;
   if(seed===1){B=12;d=6;k=2}else{k=2+r(3);d=(k===2?2:k===3?5:3)*(1+r(k===2?6:k===3?3:5));B=d+1+r(25-d)}
   const T=(k+2)*B+d;m=groupState(T,d,k,config);
   const relation=m.ref==='A'?'甲':'乙',direction=m.direction===1?'多':'少',answer=String(m[m.goal]);
   const extra=m.direction*d*(m.ref==='A'?k+1:1),net=T-extra,parts=k+2;
   const methods=[M('用乙作共同参照',`甲是乙${m.direction===1?'加':'减'} ${d}；丙是 ${k} 个${relation}。`,`三组总量可写为 ${parts} 个乙${extra>=0?'加':'减'} ${Math.abs(extra)}。`,`去掉额外量：${T}−(${extra})=${net}；乙 ${net}÷${parts}=${m.B}。`,`甲 ${m.A}，乙 ${m.B}，丙 ${m.C}；总和 ${T}、甲乙差 ${d}、丙是${relation} ${k} 倍。`)];
   if(k===2&&m.ref==='B'&&m.goal==='C')methods.push(M('直接表示丙',`甲加乙等于丙${m.direction===1?'加':'减'} ${d}。`,`三组总量是2个丙${m.direction===1?'加':'减'} ${d}；丙 (${T}−(${m.direction*d}))÷2=${m.C}。`,`代回三组条件，甲 ${m.A}、乙 ${m.B}、丙 ${m.C}。`));
   methods.push(M('有序试探并核对',`依次尝试乙为正整数，甲随之${m.direction===1?'加':'减'} ${d}，丙取${relation}的 ${k} 倍。`,`每增加1个乙，总量增加 ${parts} 人，故不会有两个不同解。`,`满足全部条件的是甲 ${m.A}、乙 ${m.B}、丙 ${m.C}。`));
   const vm=groupState(T,d,k,config==='main'?'change-difference-direction':'main');
   c={family:id,title:'三个小组',math:m,answer,prompt:`甲、乙、丙三个小组共有 ${T} 人。甲组比乙组${direction} ${d} 人，丙组人数是${relation}组的 ${k} 倍。${m.goal==='B'?'乙':'丙'}组有多少人？`,methods,rc68Diagram:{kind:'scene-groupDraft',T,d,k,goal:m.goal,ref:m.ref,direction:m.direction},ruleHints:['要得到所求小组人数，还需要知道哪个量？','甲和丙的条件中共同出现了哪一组？它能表示其他组吗？'],extension:{key:vm.configurationId,prompt:`三组仍共 ${T} 人，甲比乙${vm.direction===1?'多':'少'} ${d} 人，丙是乙 ${k} 倍。丙有多少人？`,answer:String(vm.C),solution:`先统一成乙组的份量，总量扣去带符号差额 ${vm.direction*d}，乙=${vm.B}，丙=${vm.C}；代回检验。`,math:vm,kind:'condition-change',rc68Diagram:{kind:'scene-groupDraft',T,d,k,goal:'C',ref:'B',direction:vm.direction}}};
  }else if(id==='signedProduct'&&config===sourceConfigs[id]){
   const branch=(seed-1)%4;
   const sets=[[-8,-6,-4,0,3,5,7],[-9,-8,-7,0,1,2,3],[-8,-6,-4,0,2,3,8],[-8,-6,-4,2,3,5,7]];
   const cards=sets[branch].map((x,i)=>seed<=4?x:x+(i===0?-r(4):i===6?r(4):0)),main=minProducts(cards,3),v=minProducts(cards,2),neg=cards.filter(x=>x<0),pos=cards.filter(x=>x>0),oneNeg=neg[0]*pos.at(-1)*pos.at(-2),threeNeg=neg.reduce((a,b)=>a*b,1);
   c={family:id,math:{cards,configurationId:config},answer:String(main.best),prompt:`数字卡 ${cards.join('、')}，任选三张不同的卡，乘积最小是多少？`,methods:[M('比较两类负乘积',`一负两正的最小候选 ${oneNeg}；三负的候选 ${threeNeg}。`,`含0为0，其余非负；比较两类负乘积，最小 ${main.best}。${main.plans.length>1?'有不同取法达到同一最小值。':''}`),M('完整枚举',`按卡片下标递增选三张，避免同一组合重复。`,`共 ${cards.length*(cards.length-1)*(cards.length-2)/6} 组，最小乘积 ${main.best}。`)],ruleHints:['三张乘积为负，负数张数可能有哪些情况？','各类里怎样选卡值，才能得到更小的负数？再比较类别。'],rc68Diagram:{kind:'scene-slots',values:cards,choose:3,caption:'卡值各不相同；先自主比较符号类别'},extension:{key:'choose-two',prompt:'改为任选两张不同的卡，最小乘积是多少？',answer:String(v.best),solution:`重新列举两张组合，最小 ${v.best}。三张的类别不能原封不动沿用。`,math:{cards,choose:2},kind:'condition-change',rc68Diagram:{kind:'scene-slots',values:cards,choose:2,caption:'任选两张，重新判断负数张数'}}};
  }else if(id==='digitDivisor'&&config===sourceConfigs[id]){
   const lo=seed===1?10:10+10*r(5),hi=seed===1?50:Math.min(99,lo+10*(2+r(3))),valid=[];
   for(let n=lo+1;n<hi;n++)if(n%10&&n%(n%10)===0)valid.push(n);
   const removed=valid.filter(n=>n%2===0);
   c={family:id,math:{lo,hi,valid,configurationId:config},answer:String(valid.length),prompt:`在 ${lo} 与 ${hi} 之间（不含两端）的整数中，有多少个能被自己的非零个位数字整除？`,methods:[M('按个位分组，跨十位检查',`个位只能取1到9，0不能作除数。分别列出范围内各个位的数。`,`逐一用数除以其个位，只有余数0才保留；合法数 ${valid.join('、')}。`,`共 ${valid.length} 个，各数只属于一个个位分组，不重计。`),M('按十位分段',`按各十位段逐段检查，排除不在严格区间内的端点。`,`合并合法数列表并去重，共 ${valid.length} 个。`)],ruleHints:['个位为0时，“被个位整除”有定义吗？其余数可以怎样分组？','选一个个位，检查它在不同十位段是否都能整除；区间两端算不算？'],rc68Diagram:{kind:'scene-digitRange',lo,hi},extension:{key:'even-only',prompt:`范围与整除条件不变，只保留偶数。共有多少个？`,answer:String(removed.length),solution:`从合法集合保留偶数：${removed.join('、')}，共 ${removed.length} 个。`,math:{lo,hi,evenOnly:true},kind:'condition-change',rc68Diagram:{kind:'scene-digitRange',lo,hi,evenOnly:true}}};
  }else if(id==='lShapeArea'&&config===sourceConfigs[id]){
   const inner=seed===1?3:2+r(7),border=seed===1?1:1+r(3),outer=inner+2*border,region=inner+border,answer=region**2-inner**2;
   c={family:id,math:{inner,border,configurationId:config},answer:String(answer),prompt:`大正方形内有三个小正方形：左上和右下的小正方形边长都是 ${border}，中央正方形边长 ${inner}。如图阴影L形面积是多少？`,methods:[M('推得边长后补形',`沿外边连接三段：${border}+${inner}+${border}=${outer}；阴影所在方块的边为 ${outer}−${border}=${region}。`,`从边长 ${region} 的方块减去中央边长 ${inner} 的方块，${region}²−${inner}²=${answer}。`),M('分为不重叠的两条',`阴影的竖条宽 ${border}，长 ${region}；横条宽 ${border}，除去竖条后长 ${inner}。`,`两条面积相加 ${border}×${region}+${border}×${inner}=${answer}，转角只计一次。`)],ruleHints:['图中哪些短边能连接成一条完整边？先找阴影外框的边长。','如果补成一个方块，需要减去哪块？也可以把L形分成不重叠的两条。'],rc68Diagram:{kind:'scene-hiddenL',inner,border},extension:{key:'perimeter',prompt:'尺寸不变，改求阴影L形的周长，是多少？',answer:String(4*region),solution:`外框边长 ${region}，凹进去的两边替代同长度的两段外边；周长为 ${4*region}。面积的相减不能用作周长。`,math:{inner,border,target:'perimeter'},kind:'condition-change',rc68Diagram:{kind:'scene-hiddenL',inner,border,target:'perimeter'}}};
  }else if(id==='overlapAverages'&&config===sourceConfigs[id]){
   const values=seed===1?[4,5,5,6,8,8,10]:Array.from({length:7},()=>2+r(15)),sum=a=>a.reduce((s,x)=>s+x,0),front=sum(values.slice(0,4)),back=sum(values.slice(3)),total=sum(values),answer=values[3],z=[...values,values[0],values[6]],vf=sum(z.slice(0,5)),vb=sum(z.slice(4)),vt=sum(z);
   c={family:id,math:{values,configurationId:config},answer:String(answer),prompt:`7个数，前4个平均 ${F(front,4)}，后4个平均 ${F(back,4)}，全部平均 ${F(total,7)}。第4个数是多少？`,methods:[M('总和与重叠',`先由平均乘人数，前4合计 ${front}，后4合计 ${back}，全部合计 ${total}。`,`两段合并时，第4个数出现两次，其余各一次；${front}+${back}−${total}=${answer}。`),M('先去除不重叠部分',`全部合计减后4合计，前3合计 ${total}−${back}=${total-back}。`,`前4减前3，只剩第4个：${front}−${total-back}=${answer}。`)],ruleHints:['平均数怎样和一段的总和联系？最后要找的是哪个位置？','把前后两段对齐，哪些位置在相加时被数了两次？'],extension:{key:'nine-term-overlap',prompt:`9个数，前5个平均 ${F(vf,5)}，后5个平均 ${F(vb,5)}，全部平均 ${F(vt,9)}。第5个数是多少？`,answer:String(z[4]),solution:`新的共同位置是第5个。还原总和后：${vf}+${vb}−${vt}=${z[4]}。`,math:{values:z,groupSize:5},kind:'condition-change'}};
  }
  else if(id==='parityPermutations'&&config==='first-odd-transfer'){
   const n=seed===1?8:4+r(5),odd=Math.ceil(n/2),even=Math.floor(n/2);
   const factorial=x=>{let v=1;for(let i=2;i<=x;i++)v*=i;return v},choose=(a,b)=>{let v=1;for(let i=1;i<=b;i++)v=v*(a-i+1)/i;return v};
   const answer=factorial(odd)*choose(odd+1,even)*factorial(even),changed=factorial(odd)*choose(odd,even)*factorial(even);
   c={family:id,math:{n,configurationId:config,transferConstraint:'first-odd'},answer:String(answer),
    prompt:`把 1 到 ${n} 这些不同的数字排成一行，要求任何两个偶数都不相邻。共有多少种排列？`,
    methods:[M('先排奇数，再插入不同的偶数',`先排 ${odd} 个不同奇数，有 ${factorial(odd)} 种顺序；两端和中间共 ${odd+1} 个空隙。`,
      `选 ${even} 个不同空隙，再排列不同偶数，共 ${factorial(odd)}×${choose(odd+1,even)}×${factorial(even)}=${answer} 种。`)],
    ruleHints:['把不受相邻限制的一类先安排好，另一类能放在哪些位置？','两端也算空隙；区分选择空隙与安排不同数字的顺序。'],
    extension:{key:'first-odd-with-separated-evens',kind:'condition-change',
     prompt:'偶数仍彼此不能相邻，再增加首位必须是奇数的条件。共有多少种排列？',answer:String(changed),
     solution:`先安排全部奇数，首位前的空隙不能放偶数。可用空隙由 ${odd+1} 个变为 ${odd} 个，选择 ${even} 个后排列偶数，共 ${factorial(odd)}×${choose(odd,even)}×${factorial(even)}=${changed} 种。`,
     math:{n,odd,even,nonadjacent:'even',firstParity:'odd'}}};
  }
  else throw Error('Unknown structured configuration '+id+'/'+config);
  const value=Number(c.answer);c.options=Number.isInteger(value)?[value,value+1,value-1,value+3,value-2].map(String).sort(()=>0):options(c.answer,r);
  for(let i=c.options.length-1;i>0;i--){const j=r(i+1);[c.options[i],c.options[j]]=[c.options[j],c.options[i]]}c.configurationId=config;return c;
 }
 return {catalog,sourceConfigs,extraConfigs,create,groupState,minProducts};
})(typeof module!=='undefined'?require('./competition'):{competitionRng,competitionNumericOptions,competitionFraction});
if(typeof module!=='undefined')module.exports=StructuredRecipes;

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

