<template>
  <div>
    <span>总时间：<el-input-number v-model="allTime" @change="handleAllTimeChange" :min="10" :max="Number.MAX_VALUE" label="总时间" ref="allTimeInput"></el-input-number>s</span>
    <el-button @click="playOrPause">{{canPlay?'播放':'暂停'}}</el-button>
    <el-checkbox v-model="repeat" @change="setRepeat">循环</el-checkbox>
    <editor-panel ref="editPanel" v-on:nameRightDown="nameRightDown"
                v-on:animationRightDown="animationRightDown"
                v-on:blankTrackRightDown="blankTrackRightDown"
                v-on:blankPanelRightDown="blankPanelRightDown"
                style="top: 100px;width: 100%;left: 0px;height: 500px;"
                v-on:pause="onPause"
                v-on:timeChange="timeChange"
                v-on:animationChange="animationChange"
                v-on:selectedTrackChange="selectedTrackChange"
    >
      <template v-slot:name="{track}">  <!-- 自定义左侧栏 -->
        <span class="el-panel-row-name">
          <el-button >{{track.name}}</el-button>
          <span>{{track.id.substr(0,5)}}</span>
          <i class="el-icon-edit"></i>
        </span>
      </template>
    </editor-panel>
    <div class="menu" style="position: fixed; left:0px; top:0px;width: 200px;" v-show="menuVisible" ref="menu">
      <ul class="menu-ul">
        <li class="menu-li" v-for="(item,index) in menu"
            v-bind:key="index" v-on:mousedown="callFun(item.func,item.enable)"
            v-bind:class="{'menu-li-not':!item.enable}">
          <span class="menu-li-span">{{item.label}}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import EditorPanel from './EditorPanel'
export default {
  name: 'HelloWorld',
  components: {EditorPanel},
  data () {
    return {
      repeat: true,
      canPlay: true,
      allTime: 20,
      mouseX: 0,
      mouseY: 0,
      curTrack: null,
      curAnimation: null,
      menuVisible: false,
      menu: [{func: 'insertAnimation', label: '插入动画', enable: true}, {func: 'deleteAnimation', label: '删除动画', enable: true}, {func: 'addTrack', label: '添加轨道', enable: true},
        {func: 'deleteTrack', label: '删除轨道', enable: true}]
    }
  },
  updated () {
  },
  mounted () {
    document.addEventListener('mousedown', this.hideMenu, false)
  },
  watch: {
  },
  methods: {
    /**
     * 游标时间变化
     * @param time
     */
    timeChange (time) {
      console.log('timeChange: %o', time)
    },
    /**
     * 单元动画（蓝色div）变化
     * @param animation 变化的动画
     * @param track 变化动画所属的轨道
     */
    animationChange (animation, track) {
      console.log('animationChange: animation:%o track:%o', animation, track)
    },
    /**
     * 当前选中的轨道变化（单选，不支持多选）
     * @param track
     */
    selectedTrackChange (track) {
      console.log('selectedTrackChange: %o', track)
    },
    /**
     * 设置是否循环播放
     * @param r
     */
    setRepeat (r) {
      let editPanel = this.$refs.editPanel
      if (r) {
        editPanel.playMode = 1 // 循环
      } else {
        editPanel.playMode = 0 // 不循环
      }
    },
    /**
     * 设置总时间
     * @param time
     * @param oldTime
     */
    handleAllTimeChange (time, oldTime) {
      console.log('总时间变化：%d', time, oldTime)
      let editPanel = this.$refs.editPanel
      let success = editPanel.setEndTime(time)
      if (!success) {
        this.$refs.allTimeInput.focus() // 要先聚焦
        this.$nextTick(() => { // 下一帧再变回oldTime，不然无效
          this.allTime = oldTime
        })
      }
    },
    callFun (func, enable) {
      if (!enable) return
      this[func]()
    },
    onPause () {
      this.canPlay = true
    },
    playOrPause () {
      let editPanel = this.$refs.editPanel
      if (this.canPlay) {
        this.canPlay = false
        editPanel.play()
      } else {
        this.canPlay = true
        editPanel.pause()
      }
    },
    insertAnimation () {
      console.log('insertAnimation')
      this.menuVisible = false
      let editPanel = this.$refs.editPanel
      if (this.curTrack) {
        editPanel.insertAnimation(this.mouseX, this.mouseY, {name: 'nnnnn', type: 'dsdasd'})
      }
    },
    deleteAnimation () {
      console.log('deleteAnimation')
      this.menuVisible = false
      let editPanel = this.$refs.editPanel
      if (this.curAnimation) {
        editPanel.deleteAnimation(this.curAnimation)
        this.curAnimation = null
      }
    },
    addTrack () {
      this.menuVisible = false
      let editPanel = this.$refs.editPanel
      let track = editPanel.addTrack({name: 'new'})
      console.log('addTrack: %', track)
    },
    deleteTrack () {
      console.log('deleteTrack')
      this.menuVisible = false
      let editPanel = this.$refs.editPanel
      if (this.curTrack) {
        editPanel.deleteTrack(this.curTrack.id)
        this.curTrack = null
      }
    },
    hideMenu (e) {
      if (e.button === 0) {
        this.menuVisible = false
        return
      }
      let editPanel = this.$refs.editPanel.$el
      let rect = editPanel.getBoundingClientRect()
      let mouseX = e.clientX
      let mouseY = e.clientY
      if (!(mouseX > rect.left && mouseX < rect.right && mouseY > rect.top && mouseY < rect.bottom)) {
        this.menuVisible = false
      }
    },
    showMenu (event) {
      let menu = this.$refs.menu
      menu.style.left = event.clientX + 'px'
      menu.style.top = event.clientY + 'px'
      this.menuVisible = true
    },
    nameRightDown (track, event) {
      console.log('nameRightDown： %o %o', track, event)
      this.showMenu(event)
      for (let item of this.menu) {
        if (item.func === 'insertAnimation' || item.func === 'deleteAnimation') {
          this.$set(item, 'enable', false)
        } else {
          this.$set(item, 'enable', true)
        }
      }
      this.curTrack = track
      this.curAnimation = null
      this.mouseX = event.clientX
      this.mouseY = event.clientY
    },
    animationRightDown (animation, track, event) {
      console.log('animationRightDown： %o %o %o', animation, track, event)
      this.showMenu(event)
      for (let item of this.menu) {
        if (item.func === 'deleteAnimation') {
          this.$set(item, 'enable', true)
        } else {
          this.$set(item, 'enable', false)
        }
      }
      this.curTrack = track
      this.curAnimation = animation
      this.mouseX = event.clientX
      this.mouseY = event.clientY
    },
    blankTrackRightDown (track, event) {
      console.log('blankTrackRightDown： %o %o', track, event)
      this.showMenu(event)
      for (let item of this.menu) {
        if (item.func === 'deleteAnimation') {
          this.$set(item, 'enable', false)
        } else {
          this.$set(item, 'enable', true)
        }
      }
      this.curAnimation = null
      this.curTrack = track
      this.mouseX = event.clientX
      this.mouseY = event.clientY
    },
    blankPanelRightDown (event) {
      console.log('blankTrackRightDown')
      this.showMenu(event)
      for (let item of this.menu) {
        if (item.func === 'addTrack') {
          this.$set(item, 'enable', true)
        } else {
          this.$set(item, 'enable', false)
        }
      }
      this.curAnimation = null
      this.curTrack = null
      this.mouseX = event.clientX
      this.mouseY = event.clientY
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .menu{
    background-color: #ebebeb;
    box-shadow:2px 2px 5px #000;
  }
  .menu-ul{
    list-style: none;
    margin: 0;
    padding-left: 0;
    padding-top: 2px;
    padding-bottom: 2px;
  }
  .menu-li-not{
    color: #888888;
  }
  .menu-li-not:hover{
    background-color: #a8a8a8 !important;
    cursor: pointer;
  }
  .menu-li-span{
    position: relative;
    left: 30%;
  }
  .menu-li:hover{
    background-color: #3A89DD;
  }
</style>
