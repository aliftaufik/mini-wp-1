<template>
  <div>
    <Navbar-Write
      :status="status"
      @on-cancel="$router.push(id ? `/read/${id}` : '/dashboard')"
      @on-save="saveArticle"
      @on-post="postArticle"
    ></Navbar-Write>

    <div class="container-fluid" id="write-wrapper">
      <!-- <input type="text" v-model="title" class="text-input" /> -->
      <div class="text-input">
        <input
          type="text"
          v-model="title"
          placeholder="Add Title"
          autocomplete="off"
        />
        <!-- <label for="username">Username</label> -->
      </div>
      <!-- <b-form-input
      class="text-input"
      v-model="text"
      placeholder="Enter your name"
      ></b-form-input>-->
      <vue-editor
        v-model="content"
        useCustomImageHandler
        @image-added="addImageHandler"
        @image-removed="removeImageHandler"
        placeholder="Start your journey..."
      ></vue-editor>
    </div>
    <b-modal
      id="confirm-leave"
      :static="true"
      hide-header
      hide-footer
      body-bg-variant="info"
    >
      <h5>You have unsaved changes. Do you want to save it?</h5>
      <div class="d-flex flex-wrap justify-content-center mt-3">
        <b-button
          class="secondary-action"
          pill
          variant="outline-secondary"
          active-class="active"
          @click="$bvModal.hide('confirm-leave')"
          >Cancel</b-button
        >
        <b-button
          class="secondary-action mx-0 mr-sm-3 ml-sm-5"
          pill
          variant="outline-primary"
          active-class="active"
          id="leave-nosave"
          >Don't save</b-button
        >
        <b-button
          class="main-action mt-2 mt-sm-0"
          pill
          variant="primary"
          active-class="active"
          @click="saveAndLeave"
          >Yes, save it</b-button
        >
      </div>
    </b-modal>
  </div>
</template>

<script>
import NavbarWrite from '@/components/NavbarWrite'
import { VueEditor } from 'vue2-editor'
import checkSession from '@/utils/checkSession'

export default {
  name: 'WritePage',
  components: {
    VueEditor,
    NavbarWrite
  },
  props: ['articleid'],
  data() {
    return {
      id: this.articleid,
      title: '',
      initialTitle: '',
      content: '',
      initialContent: '',
      images: [],
      status: ''
    }
  },
  computed: {
    saveToLeave() {
      return (
        this.initialTitle == this.title && this.initialContent == this.content
      )
    }
  },
  methods: {
    addImageHandler(file, Editor, cursorLocation, resetUploader) {
      // An example of using FormData
      // NOTE: Your key could be different such as:
      // formData.append('file', file)

      this.$store
        .dispatch('onEditorAddImage', file)
        .then(({ data }) => {
          let imageUrl = data.data.imageUrl // Get imageUrl from response
          this.images.push(imageUrl)
          Editor.insertEmbed(cursorLocation, 'image', imageUrl)
        })
        .catch(({ response }) => {
          this.$toasted.show(response.data.message, {
            className: 'bg-danger'
          })
        })
        .finally(() => resetUploader())
    },
    removeImageHandler(file) {
      this.images.splice(this.images.indexOf(file), 1)
    },
    saveArticle() {
      const loader = this.$loading.show()
      const featuredImage = this.images[0]
      return this.$store
        .dispatch('onSaveArticle', {
          id: this.id || undefined,
          title: this.title,
          content: this.content,
          featuredImage
        })
        .then(({ data }) => {
          this.id = data.data._id
          this.initialTitle = this.title
          this.initialContent = this.content
          this.$toasted.show('Article saved')
        })
        .catch(({ response }) => {
          const message = response.data.message
          if (typeof message != 'string') {
            response.data.message.forEach(msg => {
              this.$toasted.show(msg, { className: 'bg-danger' })
            })
          } else {
            this.$toasted.show(response.data.message, {
              className: 'bg-danger'
            })
          }
        })
        .finally(() => {
          loader.hide()
        })
    },
    saveAndLeave() {
      this.saveArticle().then(() => {
        this.$bvModal.hide('confirm-leave')
        if (this.saveToLeave) this.$router.push(`/read/${this.id}`)
      })
    },
    postArticle() {
      const loader = this.$loading.show()
      const featuredImage = this.images[0]
      return this.$store
        .dispatch('onSaveArticle', {
          id: this.id || undefined,
          title: this.title,
          content: this.content,
          status: 'posted',
          featuredImage
        })
        .then(({ data }) => {
          this.id = data.data._id
          this.initialTitle = this.title
          this.initialContent = this.content
          this.$toasted.show('Article posted')
          this.$router.push(`/read/${this.id}`)
        })
        .catch(({ response }) => {
          const message = response.data.message
          if (typeof message != 'string') {
            response.data.message.forEach(msg => {
              this.$toasted.show(msg, { className: 'bg-danger' })
            })
          } else {
            this.$toasted.show(response.data.message, {
              className: 'bg-danger'
            })
          }
        })
        .finally(() => {
          loader.hide()
        })
    }
  },
  created() {
    window.scrollTo(0, 0)
    if (localStorage.getItem('access_token')) {
      const loader = this.$loading.show()
      checkSession()
        .then(({ data }) => {
          this.$store.commit('CHANGE_USER', data.data)
          this.$store.commit('CHANGE_SESSION', true)
          if (this.id)
            return this.$store
              .dispatch('getOneArticle', this.id)
              .then(({ data }) => {
                const article = data.data
                this.title = article.title
                this.initialTitle = article.title
                this.content = article.content
                this.initialContent = article.content
                this.status = article.status
                const patt = RegExp('<img src="([^"]+)">', 'g')
                let m = []
                while ((m = patt.exec(article.content)) != null) {
                  this.images.push(m[1])
                }
              })
        })
        .catch(() => {
          localStorage.clear()
          this.$store.commit('CHANGE_SESSION', false)
          this.$router.replace('/')
        })
        .finally(() => loader.hide())
    } else this.$router.replace('/dashboard')
  },
  beforeRouteLeave(to, from, next) {
    if (this.saveToLeave) return next()
    this.$bvModal.show('confirm-leave')

    const noSave = document.getElementById('leave-nosave')
    noSave.addEventListener('click', () => {
      this.$bvModal.hide('confirm-leave')
      next()
    })
  }
}
</script>

<style lang="scss">
.text-input {
  margin-top: 2rem;
  margin-bottom: 3rem;
  input {
    background-color: transparent;
    display: block;
    // height: 40px;
    text-align: center;
    width: 100%;
    font-size: 3rem;
    font-weight: 200;
    // line-height: 40px;
    border: 0;
    // border-bottom: 1px solid #9e9e9e;
    outline: 0;
  }
}

#write-wrapper {
  padding-top: 4.5rem;
}

.quillWrapper {
  height: 80vh !important;
  #quill-container {
    margin-bottom: 1rem;
    overflow-y: scroll;

    .ql-editor {
      // margin-top: 1rem;
      margin-bottom: 3rem;
      height: auto;
    }
  }

  .ql-toolbar {
    display: flex;
    width: 100%;
    overflow-x: scroll;

    .ql-formats {
      display: block !important;
      flex-shrink: 0;
      width: auto;
      .ql-picker-item {
        color: #444;
      }

      span:hover,
      button:hover,
      svg:hover,
      .ql-active,
      .ql-selected {
        color: #9e2b25 !important;
        .ql-stroke {
          stroke: #9e2b25 !important;
        }
        .ql-fill {
          fill: #9e2b25 !important;
        }
      }
    }
  }
}
</style>
