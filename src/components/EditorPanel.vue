<template>
  <div class="el-panel" ref="panel">
    <div class="el-panel-left" ref="left">
      <div class="el-panel-content-header">
      </div>
      <div class="el-panel-content-center el-panel-content-names" ref="namesParent">
        <ul class="el-panel-names" ref="names">
          <li v-for="(item,index) in showDataset"
              v-bind:key="item.id + item.name" v-bind:id="item.id +'_'+ item.name"  v-bind:data-id="item.id"
              :style="{position:'absolute',top:index*(liHeight+5)+'px',left:'0',height:liHeight+'px'}"
              v-bind:class="{'el-panel-li':true,'el-panel-li-current':item.selected}"
              v-on:mousedown="onTrackSelect">
            <slot name="name" v-bind:track="item"><span class="el-panel-row-name">{{item.name}}</span></slot>
          </li>
        </ul>
      </div>
      <div class="el-panel-content-footer">
        <div class="el-panel-scroll-horizontal" ref="namesScrollParent" v-show="namesScrVisible">
          <div class="el-panel-scroll-horizontal-thumb" ref="namesScroll" style="position: absolute;left: 0;top: 0;width:50px;height: 10px; ">

          </div>
        </div>
      </div>
    </div>
    <div class="el-panel-center" ref="center">
      <div class="el-panel-content-header el-panel-content-header-timeline" ref="timelineParent">
        <div class="timeline-bar" ref='timeline'>
        </div>
      </div>
      <div class='el-panel-content-center el-panel-content-tracks' ref="tracksParent">
        <ul class='el-panel-tracks' ref="tracks">
          <li v-for="(item,index) in showDataset"
              v-bind:key="item.id" v-bind:id="item.id" v-bind:data-id="item.id"
              :style="{position:'absolute',top:index*(liHeight+5)+'px',left:'0',height:liHeight+'px'}"
              v-bind:class="{'el-panel-li':true,'el-panel-li-current':item.selected}"
              v-on:mousedown="onTrackSelect">
            <div class="el-panel-animation" v-for="(animation) in item.animation" v-on:mouseover="animation.iconShow = true"
                 v-on:mouseout="animation.iconShow = false" v-bind:data-id="animation.id" v-bind:id="animation.id"
                 v-on:mousedown="animationMouseDown"
                 v-bind:key="animation.id + animation.name"
                 :style="{position: 'absolute',top:'2px', left: animation.left+'px',width: animation.width+'px',height:liHeight-2+'px'}">
              <i class="el-icon-circle-plus el-panel-icon-left" v-on:mousedown="leftIconMouseDown" v-show="animation.iconShow" v-bind:data-id="animation.id"></i>
              <span>{{animation.name}}</span>
              <i class="el-icon-circle-plus el-panel-icon-right" v-show="animation.iconShow" v-on:mousedown="rightIconMouseDown" v-bind:data-id="animation.id"></i>
            </div>
          </li>
        </ul>
      </div>
      <div class="el-panel-content-footer">
        <div class="el-panel-scroll-horizontal" ref="horizontalScrollParent" v-show="horScrVisible">
          <div class="el-panel-scroll-horizontal-thumb" ref="horizontalScroll" style="position: absolute;left: 0;top: 0;width:50px;height: 10px; ">

          </div>
        </div>
      </div>
      <div class="el-panel-cursor" style="position: absolute;left: -10px;top: 15px;" ref="cursor">
        <canvas class="el-panel-cursor-canvas" style="width: 20px;height: 20px;" ref="cursorCanvas"></canvas>
        <div class="el-panel-cursor-line" style="position: absolute;left: 9px;top: 20px;width: 2px;height: 460px;" ref="cursorLine"></div>
      </div>
      <div class="el-panel-cursor" style="position: absolute;left: 110px;top: 15px;" ref="leftIconCursor" v-show="LRTimeAxisVisible">
        <span style="position: absolute;left: -20px;" ref="leftTimeSpan">{{leftTime}}</span>
        <canvas class="el-panel-cursor-canvas" style="width: 10px;height: 10px;" ref="leftIconCursorCanvas"></canvas>
        <div class="el-panel-cursor-line" style="position: absolute;left: 4px;top: 16px;width: 1px;height: 460px;" ref="leftIconCursorLine"></div>
      </div>
      <div class="el-panel-cursor" style="position: absolute;left: 500px;top: 15px;" ref="rightIconCursor" v-show="LRTimeAxisVisible">
        <span style="position: absolute;left: 10px;" ref="rightTimeSpan">{{rightTime}}</span>
        <canvas class="el-panel-cursor-canvas" style="width: 10px;height: 10px;" ref="rightIconCursorCanvas"></canvas>
        <div class="el-panel-cursor-line" style="position: absolute;left: 4px;top: 16px;width: 1px;height: 460px;" ref="rightIconCursorLine"></div>
      </div>
    </div>
    <div class="el-panel-right" ref="right">
      <div class="el-panel-content-header">
      </div>
      <div class="el-panel-content-center">
        <div class="el-panel-scroll-vertical" ref="verticalScrollParent" v-show="verScrVisible">
          <div class="el-panel-scroll-vertical-thumb" ref="verticalScroll" style="position: absolute;left: 0;top: 0;width:100%;height: 50px; ">

          </div>
        </div>
      </div>
      <div class="el-panel-content-footer">

      </div>
    </div>
  </div>
</template>

<script>
import '../assets/EditorPanel.scss'
import {generateId, StoreMap} from '../js/Util'
export default {
  data () {
    return {
      liHeight: 0, // 此值是根据showCount计算，外部设置无效
      LRTimeAxisVisible: false,
      leftTime: '0s',
      rightTime: '10s',
      intervalTime: 25,
      moveId: null, // 游标自动移动的周期函数id
      playId: null,
      playMode: 1, // 0一次，1重复

      startTime: 0, // 时间轴开始时间
      endTime: 20, // 时间轴结束时间
      cursorTime: 0, // 记录游标当前时间
      showTime: 20, // 画多少时间的刻度，刻度和标签重用
      delta: 10, // 每一小格多少像素, 因为scrollLeft只能为整数，所以应该保持播放时单次时间的移动为整数像素
      selectedTrack: null,
      minScrollLength: 20, // 滚动条最小长度

      scrollSpeed: 1, // 垂直方向滚轮速度
      verPercent: 0, // 垂直方向滚动百分比
      horPercent: 0, // 水平方向（轨道）滚动百分比
      namesPercent: 0, // 水平方向（名称）滚动百分比
      verDown: false,
      horDown: false,
      namesScrVisible: false, // 水平方向（名称）滚动是否可见
      horScrVisible: false, // 水平方向（轨道）滚动是否可见
      verScrVisible: false, // 垂直方向滚动是否可见
      namesDown: false,
      cursorDown: false,
      startMove: false,
      leftIconDown: false,
      rightIconDown: false,
      animationDown: false,
      curAnimation: null, // 记录当前操作的动画
      lastAnimation: null,
      nextAnimation: null,
      curElement: null, // 记录当前操作的动画DIV
      // 所有计算考虑1px的border getBoundingClientRect 计算包含border
      dataset: [], // 所有动画数据集
      showDataset: [], // 只用于显示的数据集（防止数据集过多 界面变卡）
      showCount: 4 // 显示多少条track（相当于track重用）
      // dataset: []
    }
  },
  name: 'EditorPanel',
  computed: {
    // 每一个大格10小格
    deltasOfBigDelta: function () {
      return 10
    },
    // 每一小格0.1s
    timeOfPerDelta: function () {
      return 1 / this.deltasOfBigDelta
    },
    // 时间轴的计算宽度由结束时间决定
    timelineWidth: function () {
      return this.delta * this.endTime * this.deltasOfBigDelta
    }

  },
  watch: {
    /**
       * 当前游标时间发生变化，发送timeChange消息
       */
    cursorTime (newTime, old) {
      this.$emit('timeChange', this.cursorTime)
      // console.log('timeChange: %o', this.cursorTime)
    },
    /**
       * 水平滚动条（轨道下面那个）百分比变化时，计算相关div位置
       */
    horPercent (percent, old) {
      if (this.horScrVisible) {
        let tracksParent = this.$refs.tracksParent
        let width = tracksParent.getBoundingClientRect().width
        let scrollLeft = Math.ceil((tracksParent.scrollWidth - width) * this.horPercent)
        tracksParent.scrollLeft = scrollLeft

        let horizontalScroll = this.$refs.horizontalScroll
        let horizontalScrollParent = this.$refs.horizontalScrollParent
        let horizontalScrollRect = horizontalScroll.getBoundingClientRect()
        let horizontalScrollParentRect = horizontalScrollParent.getBoundingClientRect()
        let length = horizontalScrollParentRect.width - horizontalScrollRect.width
        horizontalScroll.style.left = length * this.horPercent + 'px'
        this.computerRuler()
      }
    },
    /**
       * 垂直滚动条百分比变化时，计算相关div位置
       */
    verPercent (percent) {
      if (this.verScrVisible) {
        let namesParent = this.$refs.namesParent
        let tracksParent = this.$refs.tracksParent
        let height = tracksParent.getBoundingClientRect().height
        this.liHeight = height / this.showCount - 5
        let p = (this.dataset.length - this.showCount) / this.dataset.length
        if (this.verPercent > p) {
          console.log(this.verPercent, p)
          namesParent.scrollTop = Math.ceil((namesParent.scrollHeight - namesParent.getBoundingClientRect().height) * (this.verPercent - p))
          tracksParent.scrollTop = Math.ceil((tracksParent.scrollHeight - tracksParent.getBoundingClientRect().height) * (this.verPercent - p))
        } else {
          namesParent.scrollTop = 0
          tracksParent.scrollTop = 0
        }
        this.computerShowDataSet()
      }
    },
    /**
       * 水平滚动条（左侧栏下面那个）百分比变化时，计算相关div位置
       */
    namesPercent (percent) {
      if (this.namesScrVisible) {
        let namesParent = this.$refs.namesParent
        namesParent.scrollLeft = Math.ceil((namesParent.scrollWidth - namesParent.getBoundingClientRect().width) * this.namesPercent)
      }
    }
  },
  methods: {
    // 设置动画数据
    setAnimations (dataset) {
      this.dataset = dataset
    },
    /**
       * 计算用于显示的track
       */
    computerShowDataSet () {
      this.showDataset = []
      let tracksParent = this.$refs.tracksParent
      let height = tracksParent.getBoundingClientRect().height
      this.liHeight = height / this.showCount - 5
      let showCount = this.showCount
      if (this.dataset.length <= showCount) {
        for (let data of this.dataset) {
          this.showDataset.push(data)
        }
      } else {
        let index = Math.floor((this.dataset.length - showCount) * this.verPercent)
        for (let i = 0; i < showCount; i++, index++) {
          this.showDataset.push(this.dataset[index])
        }
      }
    },
    /**
       * 重新绘制时间轴，时间轴并不会移动，移动的是轨道
       */
    computerRuler () {
      let horPercent = this.horPercent
      let tracksParent = this.$refs.tracksParent
      let width = tracksParent.getBoundingClientRect().width
      let scrollLeft = Math.ceil((tracksParent.scrollWidth - width) * horPercent)
      let labels = StoreMap.get('labels') || []
      let tics = StoreMap.get('tics') || []
      let mains = StoreMap.get('mains') || []
      let ticStart = Math.ceil(scrollLeft / this.delta) * this.delta - scrollLeft
      let mainStart = Math.ceil(scrollLeft / this.delta / this.deltasOfBigDelta) * this.delta * this.deltasOfBigDelta - scrollLeft
      let timeStart = Math.ceil(scrollLeft / this.delta / this.deltasOfBigDelta)
      for (let i = 0; i < tics.length; i++) {
        let tic = tics[i]
        tic.style.left = ticStart + i * this.delta + 'px'
      }
      for (let i = 0; i < mains.length; i++) {
        let main = mains[i]
        let label = labels[i]
        let left = mainStart + i * this.delta * this.deltasOfBigDelta
        main.style.left = left + 'px'
        label.innerHTML = timeStart + i + 's'
        if (label.innerHTML === '0s' && left === 0) {
          label.style.left = left + 'px'
        } else if (label.innerHTML === (this.endTime + 's')) {
          label.style.left = left - this.computerLabelWidth(label.innerHTML) + 'px'
        } else {
          label.style.left = left - this.computerLabelWidth(label.innerHTML) / 2 + 'px'
        }
      }
    },
    // 发送单元动画变化消息
    notifyAnimationChange () {
      if (this.curAnimation === null) return
      this.$emit('animationChange', this.curAnimation, this.getTrackByAnimationId(this.curAnimation.id))
      // console.log('animationChange: %o %o', this.curAnimation, this.getTrackByAnimationId(this.curAnimation.id))
    },
    // 点击时间轴，改变游标位置，计算游标时间
    onTimelineDown (e) {
      let tracksParent = this.$refs.tracksParent
      let timelineParent = this.$refs.timelineParent
      let timelineParentRect = timelineParent.getBoundingClientRect()
      let length = e.clientX - timelineParentRect.left + tracksParent.scrollLeft
      this.cursorTime = parseFloat((length / this.delta * this.timeOfPerDelta).toFixed(1))
      this.setCursorPosByTime()
    },
    // 点击时间轴上的时间标签，改变游标位置，计算游标时间
    onLabelDown (e) {
      this.cursorTime = parseFloat(e.toElement.innerHTML.split('s')[0])
      this.setCursorPosByTime()
      e.stopPropagation()
    },
    /**
       * 页面大小变换时，重新计算相关元素大小（宽度）
       * @param e
       */
    resize (event) {
      let _this = this
      let width = this.$refs.panel.getBoundingClientRect().width // 总宽
      let center = this.$refs.center
      let left = this.$refs.left
      let right = this.$refs.right
      let tracksParent = this.$refs.tracksParent
      let tracks = this.$refs.tracks
      let names = this.$refs.names
      let namesParent = this.$refs.namesParent
      let timelineParent = this.$refs.timelineParent
      tracks.style.width = this.delta * this.endTime * this.deltasOfBigDelta + 'px' // 轨道和时间轴同宽
      let cw = width - right.getBoundingClientRect().width - left.getBoundingClientRect().width
      center.style.width = cw + 'px' // 中间（轨道和时间轴的祖父容器）宽
      if (this.timelineWidth < cw) { // 如果总时间对应的计算宽比总宽小
        tracksParent.style.width = this.timelineWidth + 'px' // 轨道宽
        timelineParent.style.width = this.timelineWidth + 'px' // 时间轴宽
      } else {
        tracksParent.style.width = cw + 'px' // 轨道的父容器宽
        timelineParent.style.width = cw + 'px'
      }
      this.$nextTick(() => {
        names.style.width = namesParent.scrollWidth + 'px'
        _this.computerScroll()
        _this.computerShowDataSet()
      })
    },
    /**
       * 设置结束时间
       * @return boolean false 时间轴总时间设置不能小于最后一个动画的时间时设置失败
       */
    setEndTime (time) {
      let maxTime = 0
      let maxTrack = null
      let maxAnimation = null
      for (let track of this.dataset) {
        if (track.animation.length > 0) {
          let a = track.animation[track.animation.length - 1]
          let time = a.endTime
          if (maxTime < time) {
            maxTime = time
            maxTrack = track
            maxAnimation = a
          }
        }
      }
      if (time < maxTime) {
        this.$message.error('时间轴总时间设置不能小于最后一个动画的时间。轨道：' + maxTrack.name + ' 的 动画：' + maxAnimation.name + '结束时间：' + maxTime)
        return false
      }
      this.endTime = time
      let _this = this
      this.drawRuler()
      this.$nextTick(() => {
        _this.resize()
        if (this.cursorTime > this.endTime) {
          this.cursorTime = this.endTime
          this.setCursorPosByTime()
        }
      })
      return true
    },
    /**
       * 绘制时间轴
       */
    drawRuler () {
      let timeline = this.$refs.timeline
      let width = this.delta * this.showTime * this.deltasOfBigDelta
      let count = Math.ceil(width / this.delta)

      let labels = []
      let tics = []
      let mains = []
      StoreMap.set('labels', labels)
      StoreMap.set('tics', tics)
      StoreMap.set('mains', mains)
      let nodes = []
      timeline.childNodes.forEach(function (item, index) {
        nodes.push(item)
      })
      for (let node of nodes) {
        timeline.removeChild(node)
        node.removeEventListener('mousedown', this.onLabelDown, false)
        node.remove()
      }
      for (let i = 1; i < count; i++) { // 小分割
        let span = document.createElement('span')
        span.classList.add('timeline-ticTiny')
        span.style.left = this.delta * i + 'px'
        timeline.appendChild(span)
        tics.push(span)
      }
      for (let i = 0; i <= width; i += this.delta * this.deltasOfBigDelta) { // 大分割和标签
        let span = document.createElement('span')
        span.classList.add('timeline-ticLabel')
        span.style.left = i + 'px'
        timeline.appendChild(span)
        labels.push(span)
        span.addEventListener('mousedown', this.onLabelDown, false)
        let time = i / this.delta * this.timeOfPerDelta + this.startTime
        span.innerText = time + 's'
        span = document.createElement('span')
        span.classList.add('timeline-ticMain')
        span.style.left = i + 'px'
        timeline.appendChild(span)
        mains.push(span)
      }
      this.$nextTick(() => { // 第一个标签不变，最后一个靠左，其余居中
        let labels = document.getElementsByClassName('timeline-ticLabel')
        for (let i = 0; i < labels.length; i++) {
          let label = labels[i]
          let left = parseFloat(label.style.left.split('px')[0])
          if (label.innerHTML === '0s' && left === 0) {
            label.style.left = left + 'px'
          } else if (label.innerHTML === (this.endTime + 's')) {
            label.style.left = left - this.computerLabelWidth(label.innerHTML) + 'px'
          } else {
            label.style.left = left - this.computerLabelWidth(label.innerHTML) / 2 + 'px'
          }
        }
        this.$nextTick(() => {
          this.computerCursorSize()
          this.setCursorPosByTime()
          this.computerScroll()
          this.computerRuler()
          this.resize()
        })
      })
    },
    // 计算时间标签的元素宽度，注意如果你要修改文字大小这里请也修改，不然和刻度对不齐
    computerLabelWidth (text) {
      let x = text.length - 1
      return x * 7.52 + 5.94
    },
    /**
       *计算左右2个时间轴的位置,并更新时间
       */
    computerLRTimeAxis () {
      let rightTimeSpan = this.$refs.rightTimeSpan
      let leftTimeSpan = this.$refs.leftTimeSpan
      let tracksParent = this.$refs.tracksParent
      let leftIconCursorCanvas = this.$refs.leftIconCursorCanvas
      let rightIconCursorCanvas = this.$refs.rightIconCursorCanvas
      let leftIconCursor = this.$refs.leftIconCursor
      let rightIconCursor = this.$refs.rightIconCursor
      if (this.curAnimation !== null) {
        let left = this.curAnimation.left - leftIconCursorCanvas.getBoundingClientRect().width / 2 - tracksParent.scrollLeft
        leftIconCursor.style.left = left + 'px'
        let right = this.curAnimation.left + this.curAnimation.width + 2 - rightIconCursorCanvas.getBoundingClientRect().width / 2 - tracksParent.scrollLeft
        rightIconCursor.style.left = right + 'px'
        // 时间根据curAnimation计算
        this.curAnimation.startTime = parseFloat((this.curAnimation.left / this.delta * this.timeOfPerDelta).toFixed(2))
        this.curAnimation.endTime = parseFloat(((this.curAnimation.left + this.curAnimation.width + 2) / this.delta * this.timeOfPerDelta).toFixed(2))
        this.leftTime = this.curAnimation.startTime
        this.rightTime = this.curAnimation.endTime
      }
      this.$nextTick(() => {
        leftTimeSpan.style.left = -leftTimeSpan.getBoundingClientRect().width + 'px'
        rightTimeSpan.style.left = rightIconCursorCanvas.getBoundingClientRect().width + 'px'
      })
    },
    /**
       *根据游标位置计算时间
       **/
    computerTimeByPos () {
      let cursor = this.$refs.cursor
      let tracksParent = this.$refs.tracksParent
      let cursorCanvas = this.$refs.cursorCanvas
      let cursorCanvasRect = cursorCanvas.getBoundingClientRect()
      let left = parseInt(cursor.style.left.split('px')[0])
      this.cursorTime = parseFloat(((left + cursorCanvasRect.width / 2 + tracksParent.scrollLeft) / this.delta * this.timeOfPerDelta).toFixed(2))
      if (this.cursorTime > this.endTime) {
        this.cursorTime = this.endTime
      }
      if (this.cursorTime < this.startTime) {
        this.cursorTime = this.startTime
      }
    },
    /**
       * 根据时间设置游标位置
       */
    setCursorPosByTime () {
      let cursor = this.$refs.cursor
      let cursorCanvas = this.$refs.cursorCanvas
      let cursorCanvasRect = cursorCanvas.getBoundingClientRect()
      let tracksParent = this.$refs.tracksParent
      let length = this.cursorTime / this.timeOfPerDelta * this.delta
      let left = -cursorCanvasRect.width / 2 + length - tracksParent.scrollLeft
      cursor.style.left = left + 'px'
    },
    /**
       * 计算游标大小
       *
       */
    computerCursorSize () {
      let center = this.$refs.center
      let centerRect = center.getBoundingClientRect()
      let cursor = this.$refs.cursor
      let top = parseInt(cursor.style.top.split('px')[0])
      let cursorCanvas = this.$refs.cursorCanvas
      let cursorCanvasRect = cursorCanvas.getBoundingClientRect()
      let cursorLine = this.$refs.cursorLine
      cursorLine.style.height = centerRect.height - top - cursorCanvasRect.height + 'px'
    },
    /**
       * 计算是否显示滚动条和滚动条的大小
       */
    computerScroll () {
      let verticalScrollParent = this.$refs.verticalScrollParent
      let verticalScroll = this.$refs.verticalScroll
      let tracksParent = this.$refs.tracksParent
      let height = tracksParent.getBoundingClientRect().height
      this.liHeight = height / this.showCount - 5
      let rawHeight = this.liHeight + 5
      let allHeight = rawHeight * this.dataset.length
      if (tracksParent.getBoundingClientRect().height < allHeight) {
        this.verScrVisible = true
        this.$nextTick(() => {
          verticalScroll.style.height = Math.max(this.minScrollLength, parseInt(tracksParent.getBoundingClientRect().height / allHeight * verticalScrollParent.getBoundingClientRect().height)) + 'px'
        })
      } else {
        this.verScrVisible = false
      }

      let horizontalScroll = this.$refs.horizontalScroll
      let horizontalScrollParent = this.$refs.horizontalScrollParent
      let hw = 0
      if (tracksParent.getBoundingClientRect().width < tracksParent.scrollWidth) {
        this.horScrVisible = true
        this.$nextTick(() => {
          hw = Math.max(this.minScrollLength, parseInt(tracksParent.getBoundingClientRect().width / tracksParent.scrollWidth * horizontalScrollParent.getBoundingClientRect().width))
          horizontalScroll.style.width = hw + 'px'
          // 根据百分比计算水平滚动条位置
          let width = tracksParent.getBoundingClientRect().width
          let scrollLeft = Math.ceil((tracksParent.scrollWidth - width) * this.horPercent)
          tracksParent.scrollLeft = scrollLeft
          horizontalScroll.style.left = Math.ceil((horizontalScrollParent.getBoundingClientRect().width - hw) * this.horPercent) + 'px'
        })
      } else {
        this.horScrVisible = false
      }

      let namesScroll = this.$refs.namesScroll
      let namesScrollParent = this.$refs.namesScrollParent
      let namesParent = this.$refs.namesParent
      let namesRect = namesParent.getBoundingClientRect()
      if (namesRect.width < namesParent.scrollWidth) {
        this.namesScrVisible = true
        this.$nextTick(() => {
          namesScroll.style.width = Math.max(this.minScrollLength, parseInt(namesRect.width / namesParent.scrollWidth * namesScrollParent.getBoundingClientRect().width)) + 'px'
        })
      } else {
        this.namesScrVisible = false
      }
    },
    /**
       * 鼠标滚动事件
       * @param e
       */
    onPanelWheel (e) {
      if (!this.verScrVisible) return
      let verticalScrollParent = this.$refs.verticalScrollParent
      let verticalScroll = this.$refs.verticalScroll
      let verticalScrollParentRect = verticalScrollParent.getBoundingClientRect()
      let verticalScrollRect = verticalScroll.getBoundingClientRect()
      let percent = this.verPercent + (e.deltaY > 0 ? 1 : -1) * this.scrollSpeed / this.dataset.length
      let top = percent * (verticalScrollParentRect.height - verticalScrollRect.height)
      if (percent > 1) {
        top = verticalScrollParentRect.height - verticalScrollRect.height
        this.verPercent = 1
      } else if (percent <= 0) {
        this.verPercent = 0
        top = 0
      } else {
        this.verPercent = percent
      }
      verticalScroll.style.top = top + 'px'
    },
    verScrollDown (e) {
      this.verDown = true
    },
    verScrollMove (e) {
      if (this.verDown) {
        let verticalScrollParent = this.$refs.verticalScrollParent
        let verticalScroll = this.$refs.verticalScroll
        let verticalScrollParentRect = verticalScrollParent.getBoundingClientRect()
        let verticalScrollRect = verticalScroll.getBoundingClientRect()
        let top = parseInt(verticalScroll.style.top.split('px')[0])
        let height = verticalScrollParentRect.height - verticalScrollRect.height
        top += e.movementY
        if (top >= 0 && top <= height) {
          verticalScroll.style.top = top + 'px'
          this.verPercent = top / height
        } else if (top < 0) {
          top = 0
          this.verPercent = 0
        } else {
          top = height
          this.verPercent = 1
        }
      }
    },
    verScrollUp (e) {
      this.verDown = false
    },
    horScrollDown (e) {
      this.horDown = true
    },
    horScrollMove (e) {
      if (this.horDown) {
        let horizontalScroll = this.$refs.horizontalScroll
        let horizontalScrollParent = this.$refs.horizontalScrollParent
        let horizontalScrollRect = horizontalScroll.getBoundingClientRect()
        let horizontalScrollParentRect = horizontalScrollParent.getBoundingClientRect()
        let left = parseInt(horizontalScroll.style.left.split('px')[0])
        let length = horizontalScrollParentRect.width - horizontalScrollRect.width
        left += e.movementX
        if (left >= 0 && left <= length) {
          horizontalScroll.style.left = left + 'px'
          this.horPercent = left / length
        } else if (left < 0) {
          left = 0
          this.horPercent = 0
        } else {
          left = length
          this.horPercent = 1
        }
        this.setCursorPosByTime()
      }
    },
    horScrollUp (e) {
      this.horDown = false
    },
    namesHorScrollDown (e) {
      this.namesDown = true
    },
    namesHorScrollMove (e) {
      if (this.namesDown) {
        let namesScroll = this.$refs.namesScroll
        let namesScrollParent = this.$refs.namesScrollParent
        let namesScrollRect = namesScroll.getBoundingClientRect()
        let namesScrollParentRect = namesScrollParent.getBoundingClientRect()
        let left = parseInt(namesScroll.style.left.split('px')[0])
        let length = namesScrollParentRect.width - namesScrollRect.width
        left += e.movementX
        if (left >= 0 && left <= length) {
          namesScroll.style.left = left + 'px'
          this.namesPercent = left / length
        } else if (left < 0) {
          left = 0
          this.namesPercent = 0
        } else {
          left = length
          this.namesPercent = 1
        }
      }
    },
    namesHorScrollUp (e) {
      this.namesDown = false
    },
    onCursorDown (e) {
      if (this.playId !== null) return
      this.cursorDown = true
    },
    // 游标一直向左移动
    leftMoveCursor () {
      if (!this.cursorDown || !this.startMove) {
        if (this.moveId !== null) {
          clearInterval(this.moveId)
          this.moveId = null
        }
        return
      }
      let tracksParent = this.$refs.tracksParent
      tracksParent.scrollLeft -= this.delta
      if (tracksParent.scrollLeft <= 0) {
        tracksParent.scrollLeft = 0
      }
      if (tracksParent.scrollLeft === 0 && this.moveId !== null) {
        clearInterval(this.moveId)
        this.moveId = null
      }
      this.computerTimeByPos()
      this.horPercent = tracksParent.scrollLeft / (tracksParent.scrollWidth - tracksParent.getBoundingClientRect().width)
    },
    // 游标一直向右移动
    rightMoveCursor () {
      if (!this.cursorDown || !this.startMove) {
        if (this.moveId !== null) {
          clearInterval(this.moveId)
          this.moveId = null
        }
        return
      }
      let tracksParent = this.$refs.tracksParent
      tracksParent.scrollLeft += this.delta
      let end = 0
      if (this.horScrVisible) {
        end = tracksParent.scrollWidth - tracksParent.getBoundingClientRect().width
      }
      if (tracksParent.scrollLeft >= end) {
        tracksParent.scrollLeft = end
      }
      if (tracksParent.scrollLeft === end && this.moveId !== null) {
        clearInterval(this.moveId)
        this.moveId = null
      }
      this.computerTimeByPos()
      this.horPercent = tracksParent.scrollLeft / (tracksParent.scrollWidth - tracksParent.getBoundingClientRect().width)
    },
    // 游标移动事件
    onCursorMove (e) {
      if (this.cursorDown && !this.startMove) {
        let cursor = this.$refs.cursor
        let cursorCanvasWidth = this.$refs.cursorCanvas.getBoundingClientRect().width
        let left = parseInt(cursor.style.left.split('px')[0])
        left += e.movementX
        let timelineParent = this.$refs.timelineParent
        let timelineParentWidth = timelineParent.getBoundingClientRect().width
        let start = -cursorCanvasWidth / 2
        let end = start + (this.timelineWidth <= timelineParentWidth ? this.timelineWidth : timelineParentWidth)
        if (left < start) {
          this.moveId = setInterval(this.leftMoveCursor, this.intervalTime)
          this.startMove = true
          left = start
        } else if (left > end) {
          if (this.horScrVisible) { // 如果有水平滚动条，当鼠标一直按着的话，一直右滚动时间轴
            this.moveId = setInterval(this.rightMoveCursor, this.intervalTime)
            this.startMove = true
          }
          left = end
        }
        cursor.style.left = left + 'px'
        this.computerTimeByPos()
      }
    },
    onCursorUp (e) {
      this.cursorDown = false
      this.startMove = false
      if (this.moveId !== null) {
        clearInterval(this.moveId)
        this.moveId = null
      }
    },

    /**
       *根据动画id获得动画所属的轨道
       */
    getTrackByAnimationId (id) {
      let dataset = this.dataset
      for (let track of dataset) {
        for (let i = 0; i < track.animation.length; i++) {
          let animation = track.animation[i]
          if (animation.id === id) {
            return track
          }
        }
      }
      return null
    },
    /**
       *根据id获得轨道
       */
    getTrackById (id) {
      let dataset = this.dataset
      for (let track of dataset) {
        if (track.id === id) {
          return track
        }
      }
      return null
    },
    /**
       *根据id获得上一个相邻动画
       */
    getLastAnimationById (id) {
      let dataset = this.dataset
      for (let track of dataset) {
        for (let i = 0; i < track.animation.length; i++) {
          let animation = track.animation[i]
          if (animation.id === id) {
            return i - 1 >= 0 ? track.animation[i - 1] : null
          }
        }
      }
    },
    /**
       *根据id获得下一个相邻动画
       */
    getNextAnimationById (id) {
      let dataset = this.dataset
      for (let track of dataset) {
        for (let i = 0; i < track.animation.length; i++) {
          let animation = track.animation[i]
          if (animation.id === id) {
            return i + 1 < track.animation.length ? track.animation[i + 1] : null
          }
        }
      }
    },
    /**
       *根据id获得动画
       */
    getAnimationById (id) {
      let dataset = this.dataset
      for (let track of dataset) {
        for (let animation of track.animation) {
          if (animation.id === id) {
            return animation
          }
        }
      }
      return null
    },
    /**
       *根据事件获得animation
       */
    getAnimationByEvent (e) {
      let animationId = e.target.getAttribute('data-id')
      if (!animationId) return null
      let animation = this.getAnimationById(animationId)
      return animation
    },
    /**
       * @param mouseX 鼠标事件clientX
       * @param mouseY 鼠标事件clientY
       * @param options 动画属性
       */
    insertAnimation (mouseX, mouseY, options) { // 加减的2是border的宽
      let panel = this.$refs.panel
      let rect = panel.getBoundingClientRect()
      if (!(mouseX > rect.left && mouseX < rect.right && mouseY > rect.top && mouseY < rect.bottom)) {
        return
      }
      // 根据鼠标位置得到所属轨道
      let parentTrack = null
      for (let track of this.showDataset) {
        let id = track.id
        let li = document.getElementById(id)
        let liRect = li.getBoundingClientRect()
        if (mouseX > liRect.left && mouseX < liRect.right && mouseY > liRect.top && mouseY < liRect.bottom) {
          parentTrack = track
          break
        }
      }
      if (parentTrack === null) return
      // 根据鼠标位置得到插入位置
      let lastAnimation = null
      let nextAnimation = null
      let startTime = 0
      let endTime = 0
      let left = 0
      let width = 0
      if (parentTrack.animation.length !== 0) {
        let first = parentTrack.animation[0]
        let fEl = document.getElementById(first.id).getBoundingClientRect()
        if (mouseX < fEl.left) {
          nextAnimation = first
        } else {
          for (let i = 0; i < parentTrack.animation.length; i++) {
            let l = parentTrack.animation[i]
            let lRect = document.getElementById(l.id).getBoundingClientRect()
            if (i === parentTrack.animation.length - 1 && lRect.right < mouseX) {
              lastAnimation = l
              nextAnimation = null
            } else {
              let r = parentTrack.animation[i + 1]
              let rRect = document.getElementById(r.id).getBoundingClientRect()
              if (lRect.right < mouseX && mouseX < rRect.left) {
                lastAnimation = l
                nextAnimation = r
                break
              }
            }
          }
        }
      }
      if (lastAnimation === null) {
        startTime = 0
        left = 0
        if (nextAnimation === null) {
          width = this.deltasOfBigDelta * this.delta - 2
          endTime = this.deltasOfBigDelta * this.timeOfPerDelta
        } else {
          if (nextAnimation.left < this.deltasOfBigDelta * this.delta) {
            width = nextAnimation.left - 2
            endTime = parseFloat((nextAnimation.left / this.delta * this.timeOfPerDelta).toFixed(2))
          } else {
            width = this.deltasOfBigDelta * this.delta - 2
            endTime = this.deltasOfBigDelta * this.timeOfPerDelta
          }
        }
      } else {
        let maxWidth = this.$refs.timelineParent.getBoundingClientRect().width
        let leave = 0
        left = lastAnimation.left + 2 + lastAnimation.width
        if (nextAnimation === null) {
          startTime = lastAnimation.endTime
          leave = maxWidth - left
          if (leave >= this.deltasOfBigDelta * this.delta) {
            width = this.deltasOfBigDelta * this.delta - 2
            endTime = startTime + this.deltasOfBigDelta * this.timeOfPerDelta
          } else {
            width = leave - 2
            endTime = startTime + parseFloat((leave / this.delta * this.timeOfPerDelta).toFixed(2))
          }
        } else {
          startTime = lastAnimation.endTime
          leave = nextAnimation.left - lastAnimation.left - lastAnimation.width - 2
          if (leave >= this.deltasOfBigDelta * this.delta) {
            width = this.deltasOfBigDelta * this.delta - 2
            endTime = startTime + this.deltasOfBigDelta * this.timeOfPerDelta
          } else {
            width = leave - 2
            endTime = startTime + parseFloat((leave / this.delta * this.timeOfPerDelta).toFixed(2))
          }
        }
      }
      let newAnimation = {id: generateId(),
        name: options.name,
        type: options.type,
        startTime: startTime,
        endTime: endTime,
        left: left,
        width: width,
        iconShow: false}
      if (nextAnimation === null) {
        parentTrack.animation.push(newAnimation)
      } else {
        let index = parentTrack.animation.indexOf(nextAnimation)
        parentTrack.animation.splice(index, 0, newAnimation)
      }
      return newAnimation
    },
    /**
       *在一个track 后插入动画
       */
    insertAfterTrack (trackId, options) {
      let parentTrack = this.getTrackById(trackId)
      if (!parentTrack) return
      let startTime = options.startTime
      let endTime = options.endTime
      let left = this.delta * startTime * this.deltasOfBigDelta
      let width = this.delta * (endTime - startTime) * this.deltasOfBigDelta - 2
      let newAnimation = {id: generateId(),
        name: options.name,
        type: options.type,
        startTime: startTime,
        endTime: endTime,
        left: left,
        width: width,
        iconShow: false}
      parentTrack.animation.push(newAnimation)
      return newAnimation
    },
    /**
       *
       *@param animationOrId animation 或者其id
       */
    deleteAnimation (animationOrId) {
      let animation = animationOrId
      if (typeof animationOrId === 'string') {
        animation = this.getAnimationById(animationOrId)
      }
      if (animation === null || animation === undefined) {
        console.error('EditPanel deleteAnimation: 不存在动画 %o', animationOrId)
        return false
      }
      let track = this.getTrackByAnimationId(animation.id)
      let animations = track.animation
      let index = animations.indexOf(animation)
      animations.splice(index, 1)
      return true
    },
    /**
       *根据轨道id删除轨道
       *@param trackId 轨道id
       */
    deleteTrack (trackId) {
      let track = this.getTrackById(trackId)
      if (track === null || track === undefined) {
        console.error('EditPanel deleteTrack: 不存在动画轨道 %o', trackId)
        return false
      }
      let index = this.dataset.indexOf(track)
      this.dataset.splice(index, 1)
      this.$nextTick(() => {
        this.resize()
      })
      return true
    },
    // 添加轨道
    addTrack (options) {
      let track = {id: generateId(), name: options.name, animation: [], selected: false}
      this.dataset.push(track)
      this.$nextTick(() => {
        this.resize()
      })
      return track
    },
    // 单元动画左侧小图标事件
    leftIconMouseDown (e) {
      if (this.playId !== null) return
      this.curAnimation = this.getAnimationByEvent(e)
      if (!this.curAnimation) return
      let animationId = e.target.getAttribute('data-id')
      this.curElement = document.getElementById(animationId)
      this.lastAnimation = this.getLastAnimationById(this.curAnimation.id)
      this.nextAnimation = this.getNextAnimationById(this.curAnimation.id)
      this.leftIconDown = true
      this.LRTimeAxisVisible = true
      this.$nextTick(this.computerLRTimeAxis)
      document.addEventListener('mousemove', this.leftIconMouseMove, false)
      document.addEventListener('mouseup', this.leftIconMouseUp, false)
      e.stopPropagation() // 禁止父控件响应事件
    },
    leftIconMouseMove (e) {
      if (this.curAnimation !== null && this.leftIconDown && e.movementX !== 0) {
        let width = this.curAnimation.width
        width -= e.movementX // 变化宽度
        if (width < this.delta) {
          return
        }
        let left = this.curAnimation.left
        left += e.movementX
        if (this.lastAnimation !== null) {
          let lastElement = document.getElementById(this.lastAnimation.id)
          let lastRect = lastElement.getBoundingClientRect()
          let start = lastRect.width + this.lastAnimation.left
          if (left < start) {
            left = start
            width += e.movementX // 和上一个想抵，宽度不变
            return
          }
        }
        if (left < 0) {
          left = 0
          width += e.movementX // 和上一个想抵，宽度不变
        }
        this.curAnimation.width = width
        this.curAnimation.left = left
        let _this = this
        this.$nextTick(() => {
          _this.computerLRTimeAxis()
          _this.notifyAnimationChange()
        })
      }
    },
    leftIconMouseUp (e) {
      this.leftIconDown = false
      this.curAnimation = null
      this.curElement = null
      this.LRTimeAxisVisible = false
      document.removeEventListener('mousemove', this.leftIconMouseMove, false)
      document.removeEventListener('mouseup', this.leftIconMouseUp, false)
    },
    // 单元动画右侧图标事件
    rightIconMouseDown (e) {
      if (this.playId !== null) return
      this.curAnimation = this.getAnimationByEvent(e)
      if (!this.curAnimation) return
      let animationId = e.target.getAttribute('data-id')
      this.curElement = document.getElementById(animationId)
      this.lastAnimation = this.getLastAnimationById(this.curAnimation.id)
      this.nextAnimation = this.getNextAnimationById(this.curAnimation.id)
      this.rightIconDown = true
      this.LRTimeAxisVisible = true
      this.$nextTick(this.computerLRTimeAxis)
      document.addEventListener('mousemove', this.rightIconMouseMove, false)
      document.addEventListener('mouseup', this.rightIconMouseUp, false)
      e.stopPropagation() // 禁止父控件响应事件
    },
    rightIconMouseMove (e) {
      if (this.rightIconDown && this.curAnimation !== null && e.movementX !== 0) {
        let width = this.curAnimation.width
        width += e.movementX
        if (width < this.delta) {
          return
        }
        let right = this.curAnimation.left + width + 2
        if (this.nextAnimation !== null) {
          let end = this.nextAnimation.left
          if (right > end) {
            width = end - this.curAnimation.left - 2
          }
        } else { // 最后一个不能越边
          let tracksParent = this.$refs.tracksParent
          let end = this.timelineWidth
          if (this.horScrVisible) {
            end = tracksParent.scrollWidth
          }
          if (right > end) {
            width = end - this.curAnimation.left - 2
          }
        }
        this.curAnimation.width = width
        let _this = this
        this.$nextTick(() => {
          _this.computerLRTimeAxis()
          _this.notifyAnimationChange()
        })
      }
    },
    rightIconMouseUp (e) {
      this.LRTimeAxisVisible = false
      this.rightIconDown = false
      this.curAnimation = null
      document.removeEventListener('mousemove', this.rightIconMouseMove, false)
      document.removeEventListener('mouseup', this.rightIconMouseUp, false)
    },
    // 单元动画事件
    animationMouseDown (e) {
      if (this.playId !== null) return
      this.curAnimation = this.getAnimationByEvent(e)
      if (!this.curAnimation) return
      this.LRTimeAxisVisible = true
      this.animationDown = true
      this.curElement = e.target
      this.$nextTick(this.computerLRTimeAxis)
      this.lastAnimation = this.getLastAnimationById(this.curAnimation.id)
      this.nextAnimation = this.getNextAnimationById(this.curAnimation.id)
      document.addEventListener('mousemove', this.animationMouseMove, false)
      document.addEventListener('mouseup', this.animationMouseUp, false)
      this.$emit('selectedAnimationChange', this.curAnimation, this.getTrackByAnimationId(this.curAnimation.id))
    },
    animationMouseMove (e) {
      if (this.animationDown && this.curAnimation !== null && e.movementX !== 0) {
        let left = this.curAnimation.left
        left += e.movementX
        let curRect = this.curElement.getBoundingClientRect()
        if (this.lastAnimation !== null) {
          let lastElement = document.getElementById(this.lastAnimation.id)
          let lastRect = lastElement.getBoundingClientRect()
          let start = lastRect.width + this.lastAnimation.left
          if (left < start) {
            left = start
          }
        }
        if (this.nextAnimation !== null) {
          let end = this.nextAnimation.left - curRect.width
          if (left > end) {
            left = end
          }
        } else { // 最后一个不能越边
          let tracksParent = this.$refs.tracksParent
          let end = this.timelineWidth - curRect.width
          if (this.horScrVisible) {
            end = tracksParent.scrollWidth - curRect.width
          }
          if (left > end) {
            left = end
          }
        }
        if (left < 0) { // 第一个不能越边，每一个不能和前一个交叉
          left = 0
        }
        this.curAnimation.left = left
        let _this = this
        this.$nextTick(() => {
          _this.computerLRTimeAxis()
          _this.notifyAnimationChange()
        })
      }
    },
    animationMouseUp (e) {
      this.animationDown = false
      this.LRTimeAxisVisible = false
      this.curElement = null
      this.curAnimation = null
      this.lastAnimation = null
      this.nextAnimation = null
      document.removeEventListener('mousemove', this.animationMouseMove, false)
      document.removeEventListener('mouseup', this.animationMouseUp, false)
    },
    /**
       * 获得动画数据
       * @returns {*[]|*}
       */
    getAnimations () {
      return this.dataset
    },
    /**
       * 当前选中轨道变化
       * @param e
       */
    onTrackSelect (e) {
      let trackId = e.target.getAttribute('data-id')
      if (!trackId) return
      let track = this.getTrackById(trackId)
      if (!track) return
      if (this.selectedTrack === null) {
        this.selectedTrack = track
        this.$set(this.selectedTrack, 'selected', true)
        this.$emit('selectedTrackChange', track)
        // console.log('selectedTrackChange: %o', track)
        return
      }
      if (this.selectedTrack !== track) {
        this.$set(this.selectedTrack, 'selected', false)
        this.selectedTrack = track
        this.$set(this.selectedTrack, 'selected', true)
        this.$emit('selectedTrackChange', track)
        // console.log('selectedTrackChange: %o', track)
      }
    },
    /**
       * 鼠标右键点击
       * 判断点击位置发生消息
       * @param e
       */
    onRightDown (e) {
      if (e.button !== 2) return
      // 根据鼠标位置得到所属轨道
      let mouseX = e.clientX
      let mouseY = e.clientY
      let panel = this.$refs.panel
      let tracksParent = this.$refs.tracksParent
      let rect = panel.getBoundingClientRect()
      let tracksParentRect = tracksParent.getBoundingClientRect()
      if (!(mouseX > rect.left && mouseX < rect.right && mouseY > tracksParentRect.top && mouseY < tracksParentRect.bottom)) {
        return
      }
      e.preventDefault()
      if (this.dataset.length === 0) {
        this.$emit('blankPanelRightDown', e) // 右键空白面板
        return
      }
      for (let track of this.showDataset) {
        let id = track.id
        for (let animation of track.animation) {
          let animationEl = document.getElementById(animation.id)
          let aElRect = animationEl.getBoundingClientRect()
          if (mouseX > aElRect.left && mouseX < aElRect.right && mouseY > aElRect.top && mouseY < aElRect.bottom) {
            this.notifyAnimationRightDown(animation, track, e)
            return
          }
        }
        let trackLi = document.getElementById(id)
        let trackLiRect = trackLi.getBoundingClientRect()
        if (mouseX > trackLiRect.left && mouseX < trackLiRect.right && mouseY > trackLiRect.top && mouseY < trackLiRect.bottom) {
          this.notifyBlankTrackRightDown(track, e)
          return
        }
        let nameLi = document.getElementById(id + '_' + track.name)
        let nameLiRect = nameLi.getBoundingClientRect()
        if (mouseX > nameLiRect.left && mouseX < nameLiRect.right && mouseY > nameLiRect.top && mouseY < nameLiRect.bottom) {
          this.notifyNameRightDown(track, e)
          return
        }
      }
      this.$emit('blankPanelRightDown', e) // 右键空白面板
    },
    /**
       * 右键名称
       */
    notifyNameRightDown (track, e) {
      this.$emit('nameRightDown', track, e)
    },
    /**
       * 右键动画
       */
    notifyAnimationRightDown (animation, track, e) {
      this.$emit('animationRightDown', animation, track, e)
    },
    /**
       * 右键空白轨道
       */
    notifyBlankTrackRightDown (track, e) {
      this.$emit('blankTrackRightDown', track, e)
    },
    /**
       * 播放
       * 尝试过使用requestAnimation ,这样就和this.delta，无关，但是时间不准
       * 使用setInterval 相对误差小一点
       * 默认 每10ms移动1px,1s移动100px,刚好一个大刻度（因为this.delta=10）所以如果修改了this.delta，这里也要改
       */
    play () {
      if (this.playId !== null) return
      this.$emit('play')
      this.playId = setInterval(() => {
        let delta = 0.01 * this.delta * this.deltasOfBigDelta
        let tracksParent = this.$refs.tracksParent
        tracksParent.scrollLeft += delta
        let tracksParentElWidth = tracksParent.getBoundingClientRect().width
        let end = 0
        if (this.horScrVisible) {
          end = tracksParent.scrollWidth - tracksParentElWidth
        }
        let cursor = this.$refs.cursor
        let cursorCanvasWidth = this.$refs.cursorCanvas.getBoundingClientRect().width
        let left = parseFloat(cursor.style.left.split('px')[0])
        let curMinStart = -cursorCanvasWidth / 2 // 游标left的最小值
        let curMaxEnd = curMinStart + (this.timelineWidth <= tracksParentElWidth ? this.timelineWidth : tracksParentElWidth) // 游标left的最大值
        if (tracksParent.scrollLeft >= end) { // 如果时间轴已经到了最后
          tracksParent.scrollLeft = end
          if (left >= curMaxEnd) { // 如果游标已经滑到最右边
            left = curMaxEnd
            cursor.style.left = left + 'px'
            if (this.playMode === 0) {
              this.pause()
            } else if (this.playMode === 1) {
              cursor.style.left = curMinStart + 'px'
              if (this.horScrVisible) { // 如果有水平滚动条，更新滚动条位置
                this.horPercent = 0
              }
            }
          } else { // 如果游标没有滑到最右边，开始滑游标
            left += delta
            cursor.style.left = left + 'px'
          }
        } else { // 如果时间轴没有到最后，则先移动时间轴和轨道，游标位置不变
          if (this.horScrVisible) { // 如果有水平滚动条，更新滚动条位置
            this.horPercent = tracksParent.scrollLeft / (tracksParent.scrollWidth - tracksParent.getBoundingClientRect().width)
          }
        }
        this.computerTimeByPos()
      }, 10)
    },
    /**
       * 暂停
       */
    pause () {
      this.$emit('pause')
      if (this.playId) {
        clearInterval(this.playId)
        this.playId = null
      }
    }
  },
  created () {

  },
  beforeDestroy () {
    let _this = this
    let panel = this.$refs.panel
    let horizontalScroll = this.$refs.horizontalScroll
    let verticalScroll = this.$refs.verticalScroll
    let namesScroll = this.$refs.namesScroll
    let cursorCanvas = this.$refs.cursorCanvas
    let timeline = this.$refs.timeline
    // scroll
    panel.removeEventListener('wheel', this.onPanelWheel, {passive: true})
    window.removeEventListener('resize', this.resize, false)
    verticalScroll.removeEventListener('mousedown', this.verScrollDown, false)
    document.removeEventListener('mousemove', this.verScrollMove, false)
    document.removeEventListener('mouseup', this.verScrollUp, false)
    horizontalScroll.removeEventListener('mousedown', this.horScrollDown, false)
    document.removeEventListener('mousemove', this.horScrollMove, false)
    document.removeEventListener('mouseup', this.horScrollUp, false)
    namesScroll.removeEventListener('mousedown', this.namesHorScrollDown, false)
    document.removeEventListener('mousemove', this.namesHorScrollMove, false)
    document.removeEventListener('mouseup', this.namesHorScrollUp, false)

    // timeline
    cursorCanvas.removeEventListener('mousedown', this.onCursorDown, false)
    document.removeEventListener('mousemove', this.onCursorMove, false)
    document.removeEventListener('mouseup', this.onCursorUp, false)
    timeline.removeEventListener('mousedown', this.onTimelineDown, false)
    timeline.childNodes.forEach(function (item, index) {
      item.removeEventListener('mousedown', _this.onLabelDown, false)
    })
    this.pause()
    if (this.playId) {
      cancelAnimationFrame(this.playId)
    }
  },
  mounted () {
    this.drawRuler()
    let panel = this.$refs.panel
    let horizontalScroll = this.$refs.horizontalScroll
    let verticalScroll = this.$refs.verticalScroll
    let namesScroll = this.$refs.namesScroll
    let cursorCanvas = this.$refs.cursorCanvas
    let timeline = this.$refs.timeline
    // scroll
    panel.addEventListener('wheel', this.onPanelWheel, {passive: true})
    window.addEventListener('resize', this.resize, false)
    verticalScroll.addEventListener('mousedown', this.verScrollDown, false)
    document.addEventListener('mousemove', this.verScrollMove, false)
    document.addEventListener('mouseup', this.verScrollUp, false)
    horizontalScroll.addEventListener('mousedown', this.horScrollDown, false)
    document.addEventListener('mousemove', this.horScrollMove, false)
    document.addEventListener('mouseup', this.horScrollUp, false)
    namesScroll.addEventListener('mousedown', this.namesHorScrollDown, false)
    document.addEventListener('mousemove', this.namesHorScrollMove, false)
    document.addEventListener('mouseup', this.namesHorScrollUp, false)

    // timeline
    cursorCanvas.addEventListener('mousedown', this.onCursorDown, false)
    document.addEventListener('mousemove', this.onCursorMove, false)
    document.addEventListener('mouseup', this.onCursorUp, false)
    timeline.addEventListener('mousedown', this.onTimelineDown, false)

    // 右键事件
    panel.oncontextmenu = this.onRightDown
  }
}
</script>

<style scoped>

</style>
