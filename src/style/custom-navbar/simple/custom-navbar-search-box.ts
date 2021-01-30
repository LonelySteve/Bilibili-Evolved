import { NavbarComponent } from '../custom-navbar-component'
interface SuggestItem {
  value: string
  html: string
}
interface HistoryItem {
  value: string
  isHistory: number
  timestamp: number
}
const SearchHistoryKey = 'be_search_history'
const SearchHistoryMaxItems = 10
const getHistoryItems = () => {
  const historyText = localStorage.getItem(SearchHistoryKey)
  const historyItems: HistoryItem[] = historyText ? JSON.parse(historyText) : []
  return historyItems
}
const clearHistoryItems = () => localStorage.setItem(SearchHistoryKey, '[]')
const addHistoryItem = (item: HistoryItem) => {
  localStorage.setItem(SearchHistoryKey, JSON.stringify(
    _.sortBy(_.uniqBy(getHistoryItems().concat(item), h => h.value), h => h.timestamp)
      .reverse()
      .slice(0, SearchHistoryMaxItems)
  ))
}
const deleteHistoryItem = (keyword: string) => {
  const items = getHistoryItems()
  const index = items.findIndex(it => it.value === keyword)
  if (index !== -1) {
    items.splice(index, 1)
    localStorage.setItem(SearchHistoryKey, JSON.stringify(items))
  }
}
const migrateOldHistory = () => {
  if (settings.searchHistory.length > 0) {
    try {
      const currentHistory = getHistoryItems()
      const oldHistory: HistoryItem[] = settings.searchHistory.map(it => {
        return {
          value: it.keyword,
          isHistory: 1,
          timestamp: Number(new Date(it.date)),
        }
      })
      const newHistory = _.sortBy(_.uniqBy(oldHistory.concat(currentHistory), h => h.value), h => h.timestamp)
        .reverse()
        .slice(0, SearchHistoryMaxItems)
      localStorage.setItem(SearchHistoryKey, JSON.stringify(newHistory))
      settings.searchHistory = []
    } catch (error) {
      console.error(error)
    }
  }
}
const getIdJump = (text: string) => {
  const avMatch = text.match(/^av([\d]+)$/i)
  if (avMatch) {
    return {
      success: true,
      text,
      link: `https://www.bilibili.com/av${avMatch[1]}`,
      aid: avMatch[1],
      bvid: ''
    }
  }
  const bvidMatch = text.match(/^bv[\da-zA-Z]+$/i)
  if (bvidMatch) {
    return {
      success: true,
      text,
      link: `https://www.bilibili.com/${text.replace(/^bv/i, 'BV')}`,
      aid: '',
      bvid: text.replace(/^bv/i, 'BV'),
    }
  }
  return {
    success: false,
    text,
    link: '',
    aid: '',
    bvid: '',
  }
}
export class SearchBox extends NavbarComponent {
  constructor() {
    super()
    this.disabled = true
    this.html = /*html*/`
      <form id="custom-navbar-search" autocomplete="off" target="_blank" method="get" action="https://search.bilibili.com/all">
        <input type="text" placeholder="搜索" name="keyword">
        <input type="hidden" name="from_source" value="nav_suggest_new">
        <a style="display: none" target="_blank" class="recommended-target"></a>
        <button type="submit" title="搜索" tabindex="-1">
          <svg style="width:22px;height:22px" viewBox="0 0 24 24">
            <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
          </svg>
        </button>
      </form>
      <div class="popup search-list" :class="{empty: items.length === 0}">
        <div
          class="search-list-item"
          tabindex="0"
          v-for="(item, index) of items"
          :title="isHistory ? item.html : ''"
          @keydown.enter="submit(item.value)"
          @keydown.shift.delete="deleteItem(item, index)"
          @keydown.down.prevent="nextItem(index)"
          @keydown.up.prevent="previousItem(index)">
          <div
            @click.self="submit(item.value)"
            class="search-list-item-text"
            :title="item.value"
            v-html="item.html"></div>
          <div
            class="delete-history"
            v-if="isHistory"
            title="删除此项"
            @click="deleteItem(item, index)">
            <i class="mdi mdi-18px mdi-close"></i>
          </div>
        </div>
        <div
          class="search-list-item clear-history"
          tabindex="0"
          v-if="items.length > 0 && isHistory"
          @click="clearSearchHistory()"
          @keydown.enter="clearSearchHistory()"
          @keydown.down.prevent="nextItem(items.length)"
          @keydown.up.prevent="previousItem(items.length)">
          <i class="mdi mdi-18px mdi-delete-sweep"></i>
          清除搜索历史
        </div>
        <div class="copy-tip" :class="{show: showCopyTip}">
          已复制
        </div>
      </div>
    `
    this.init()
  }
  async init() {
    const form = await SpinQuery.select('#custom-navbar-search') as HTMLFormElement
    const keywordInput = form.querySelector("input[name='keyword']") as HTMLInputElement
    migrateOldHistory()
    if (document.URL.startsWith('https://search.bilibili.com/all')) {
      keywordInput.value = window.location.search.match(/keyword=([^&]+)/)?.[1] || ''
    }
    form.addEventListener('submit', e => {
      if (keywordInput.value === '') {
        if (!settings.hideTopSearch) {
          (form.querySelector('.recommended-target') as HTMLElement).click()
        } else {
          window.open('https://search.bilibili.com')
        }
        e.preventDefault()
        return false
      }
      const idJump = getIdJump(keywordInput.value)
      if (idJump.success) {
        window.open(idJump.link, '_blank')
        e.preventDefault()
        return false
      }
      const historyItem = getHistoryItems().find(item => item.value === keywordInput.value)
      if (historyItem) {
        historyItem.timestamp = Number(new Date())
      } else {
        const newItem: HistoryItem = {
          value: keywordInput.value,
          isHistory: 1,
          timestamp: Number(new Date()),
        }
        addHistoryItem(newItem)
      }
      return true
    })
    if (!settings.hideTopSearch) {
      const json = await Ajax.getJson('https://api.bilibili.com/x/web-interface/search/default')
      if (json.code === 0) {
        keywordInput.setAttribute('placeholder', json.data.show_name)
        let href
        if (json.data.url !== '') {
          href = json.data.url
        }
        else if (json.data.name.startsWith('av')) {
          href = `https://www.bilibili.com/${json.data.name}`
        }
        else {
          href = `https://search.bilibili.com/all?keyword=${json.data.name}`
        }
        (form.querySelector('.recommended-target') as HTMLElement).setAttribute('href', href)
      }
      else {
        console.error('[自定义顶栏] 获取搜索推荐词失败')
      }
    }
    const searchList = new Vue({
      el: dq('.popup.search-list') as HTMLElement,
      data: {
        items: [] as SuggestItem[],
        isHistory: true,
        showCopyTip: false,
      },
      methods: {
        closeCopyTip: _.debounce(function () { this.showCopyTip = false }, 2000),
        copy(value: string) {
          GM.setClipboard(value, 'text')
          this.showCopyTip = true
          this.closeCopyTip()
        },
        submit(value: string) {
          if (getIdJump(value).success) {
            this.copy(value)
          } else {
            keywordInput.value = value
            form.requestSubmit()
          }
        },
        nextItem(index: number) {
          const item = dq(`.custom-navbar .search-list-item:nth-child(${index + 2})`) as HTMLElement
          if (item) {
            item.focus()
          }
        },
        previousItem(index: number) {
          const item = dq(`.custom-navbar .search-list-item:nth-child(${index})`) as HTMLElement
          if (item) {
            item.focus()
          } else {
            keywordInput.focus()
            return
          }
        },
        deleteItem(item: SuggestItem, index: number) {
          if (keywordInput.value !== '') {
            keywordInput.value = ''
          }
          deleteHistoryItem(item.value)
          this.items.splice(index, 1)
        },
        clearSearchHistory() {
          clearHistoryItems()
          this.items = []
        }
      },
    })
    let lastQueuedRequest = ''
    const updateSuggest = async () => {
      const text = keywordInput.value
      searchList.isHistory = text === ''
      const idJump = getIdJump(text)
      if (searchList.isHistory) {
        searchList.items = getHistoryItems()
          .sort((a, b) => b.timestamp - a.timestamp)
          .map(item => {
            return {
              value: item.value,
              html: item.value,
            }
          }).slice(0, SearchHistoryMaxItems)
      } else if (idJump.success) {
        searchList.items = []
        const url = idJump.aid ? `https://api.bilibili.com/x/web-interface/view?aid=${idJump.aid}` : `https://api.bilibili.com/x/web-interface/view?bvid=${idJump.bvid}`
        const json = await Ajax.getJson(url)
        if (idJump.aid) {
          const bvid = _.get(json, 'data.bvid', null)
          if (bvid !== null) {
            searchList.items = [
              {
                value: bvid,
                html: `复制BV号: ${bvid}`,
              },
              // {
              //   value: `https://www.bilibili.com/${bvid}`,
              //   html: `复制BV号链接: https://.../${bvid}`,
              // }
            ]
          }
        } else if (idJump.bvid) {
          const aid = _.get(json, 'data.aid', null)
          if (aid !== null) {
            searchList.items = [
              {
                value: 'av' + aid,
                html: `复制AV号: av${aid}`,
              },
              // {
              //   value: `https://www.bilibili.com/av${aid}`,
              //   html: `复制AV号链接: https://.../av${aid}`,
              // }
            ]
          }
        }
      } else {
        const url = `https://s.search.bilibili.com/main/suggest?func=suggest&suggest_type=accurate&sub_type=tag&main_ver=v1&highlight=&userid=${getUID()}&bangumi_acc_num=1&special_acc_num=1&topic_acc_num=1&upuser_acc_num=3&tag_num=10&special_num=10&bangumi_num=10&upuser_num=3&term=${text}`
        lastQueuedRequest = url
        const json = await Ajax.getJson(url)
        if (json.code !== 0 || lastQueuedRequest !== url) {
          return
        }
        const results = json.result.tag
        if (results === undefined) {
          searchList.items = []
          return
        }
        searchList.items = results.map((item: any) => {
          return {
            value: item.value,
            html: item.name.replace(/suggest_high_light/g, 'suggest-highlight')
          }
        })
      }
    }
    updateSuggest()
    const debouncedSuggest = _.debounce(updateSuggest, 200)
    let composing = false
    keywordInput.addEventListener('compositionstart', () => composing = true)
    keywordInput.addEventListener('compositionend', () => {
      composing = false
      raiseEvent(keywordInput, 'input')
    })
    keywordInput.addEventListener('input', () => {
      if (!composing) {
        debouncedSuggest()
      }
    })
    keywordInput.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' && searchList.items.length > 0) {
        e.preventDefault();
        (dq('.custom-navbar .search-list-item:first-child') as HTMLElement).focus()
      }
    })
  }
  get name(): keyof CustomNavbarOrders {
    return 'search'
  }
}
export default {
  export: {
    SearchBox,
  },
}