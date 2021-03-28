<template>
    <v-card flat tile min-height="380" class="d-flex flex-column">
        <confirm ref="confirm"></confirm>
        <v-card-text
            v-if="!path"
            class="grow d-flex justify-center align-center grey--text"
        >Select a folder or a file</v-card-text>
        <v-card-text
            v-else-if="isFile"
            class="grow d-flex justify-center align-center"
        >File: {{ path }}</v-card-text>
        <v-card-text v-else-if="dirs.length || files.length" class="grow">
            <v-list subheader v-if="dirs.length">
                <v-subheader>Folders</v-subheader>
                <v-list-item
                    v-for="item in dirs"
                    :key="item.basename"
                    @click.once="changePath(item.path)"
                    class="pl-0"
                >
                    <v-list-item-avatar class="ma-0">
                        <v-icon>mdi-folder-outline</v-icon>
                    </v-list-item-avatar>
                    <v-list-item-content class="py-2">
                        <v-list-item-title v-text="item.basename"></v-list-item-title>
                    </v-list-item-content>
                    <v-list-item-action>
                        <v-btn icon @click.stop="deleteItem(item)">
                            <v-icon color="grey lighten-1">mdi-delete-outline</v-icon>
                        </v-btn>
                        <v-btn icon v-if="false">
                            <v-icon color="grey lighten-1">mdi-information</v-icon>
                        </v-btn>
                    </v-list-item-action>
                </v-list-item>
            </v-list>
            <v-divider v-if="dirs.length && files.length"></v-divider>
            <v-list subheader v-if="files.length">
                <v-subheader>Files</v-subheader>
                <v-list-item
                    v-for="item in files"
                    :key="item.basename"
                    @click="itemClicked(item)"
                    v-selected="fileSelected(item)"
                    class="pl-0"
                >
                    <v-list-item-avatar class="ma-0">
                        <v-icon>{{ icons[item.extension.toLowerCase()] || icons['other'] }}</v-icon>
                    </v-list-item-avatar>

                    <v-list-item-content class="py-2">
                        <v-list-item-title v-text="item.basename"></v-list-item-title>
                        <v-list-item-subtitle>{{ formatBytes(item.size) }}</v-list-item-subtitle>
                    </v-list-item-content>

                    <v-list-item-action>
                        <v-btn icon @click.stop="deleteItem(item)">
                            <v-icon color="grey lighten-1">mdi-delete-outline</v-icon>
                        </v-btn>
                        <v-btn icon v-if="false">
                            <v-icon color="grey lighten-1">mdi-information</v-icon>
                        </v-btn>
                    </v-list-item-action>
                </v-list-item>
            </v-list>
        </v-card-text>
        <v-card-text
            v-else-if="filter"
            class="grow d-flex justify-center align-center grey--text py-5"
        >No files or folders found</v-card-text>
        <v-card-text
            v-else
            class="grow d-flex justify-center align-center grey--text py-5"
        >The folder is empty</v-card-text>
        <v-divider v-if="path"></v-divider>
        <v-toolbar v-if="false && path && isFile" dense flat class="shrink">
            <v-btn icon>
                <v-icon>mdi-download</v-icon>
            </v-btn>
        </v-toolbar>
        <v-toolbar v-if="path && isDir" dense flat class="shrink">
            <v-text-field
                solo
                flat
                hide-details
                label="Filter"
                v-model="filter"
                prepend-inner-icon="mdi-filter-outline"
                class="ml-n3"
            ></v-text-field>
            <v-btn icon v-if="false">
                <v-icon>mdi-eye-settings-outline</v-icon>
            </v-btn>
            <v-btn icon @click="load">
                <v-icon>mdi-refresh</v-icon>
            </v-btn>
        </v-toolbar>
    </v-card>
</template>

<script>
import { formatBytes } from "./util";
import Confirm from "./Confirm.vue";

export default {
    props: {
        icons: Object,
        storage: String,
        root: Object,
        path: String,
        endpoints: Object,
        axios: Function,
        refreshPending: Boolean,
    },
    components: {
        Confirm
    },
    data() {
        return {
            items: [],
            filter: ""
        };
    },
    computed: {
        dirs() {
            return this.items.filter(
                item =>
                    item.type === "dir" && item.basename.includes(this.filter)
            );
        },
        files() {
            return this.items.filter(
                item =>
                    item.type === "file" && item.basename.includes(this.filter)
            );
        },
        isDir() {
            return this.path[this.path.length - 1] === "/";
        },
        isFile() {
            return !this.isDir;
        }
    },
    directives: {
        selected: {
            bind: function (el, binding, vNode) {
                // Make sure expression provided is a function
                if (typeof binding.value !== 'function') {
                    // Fetch name of component
                    const compName = vNode.context.name
                    // pass warning to console
                    let warn = `[selected:] provided expression '${binding.expression}' is not a function, but has to be`
                    if (compName) { warn += `Found in component '${compName}' ` }

                    console.warn(warn)
                }

                // Define variable
                let pressTimer = null

                // Define funtion handlers
                // Create timeout ( run function after 1s )
                let start = (e) => {

                    if (e.type === 'click' && e.button !== 0) {
                        return;
                    }

                    if (pressTimer === null) {
                        pressTimer = setTimeout(() => {
                            // Run function
                            handler()
                        }, 1000)
                    }
                }

                // Cancel Timeout
                let cancel = (e) => {
                    // Check if timer has a value or not
                    if (pressTimer !== null) {
                        clearTimeout(pressTimer)
                        pressTimer = null
                    }
                }
                // Run Function
                const handler = (e) => {
                    binding.value(e)
                }

                // Add Event listeners
                // Double-click triggers the handler immediately
                el.addEventListener("dblclick", handler);
                // Only monitor beginning of touch event for now
                //el.addEventListener("mousedown", start);
                el.addEventListener("touchstart", start);
                // Cancel timeouts if these events happen
                el.addEventListener("click", cancel);
                el.addEventListener("mouseout", cancel);
                el.addEventListener("touchend", cancel);
                el.addEventListener("touchcancel", cancel);
            }
        }
    },
    methods: {
        formatBytes,
        itemClicked(item) {
            if (item.type === "dir") {
                this.changePath(item.path);
            }
        },
        fileSelected(item) {
            return () => this.$emit("file-selected", item);
        },
        changePath(path) {
            this.$emit("path-changed", path);
        },
        async load() {
            this.$emit("loading", true);
            if (this.isDir) {
                let url = this.endpoints.list.url
                    .replace(new RegExp("{storage}", "g"), this.storage)
                    .replace(new RegExp("{path}", "g"), this.path);

                let config = {
                    url,
                    method: this.endpoints.list.method || "get"
                };

                let response = await this.axios.request(config);
                this.items = response.data;
            } else {
                // TODO: load file
            }
            this.$emit("loading", false);
        },
        async deleteItem(item) {
            let message = `Are you sure<br>you want to delete this ${
                    item.type === "dir" ? "folder" : "file"
                }?<br><em>${item.basename}</em>`;
            this.$emit('item-deleting', item, (customMessage) => message = customMessage);
            let confirmed = await this.$refs.confirm.open(
                "Delete",
                message
            );

            if (confirmed) {
                this.$emit("loading", true);
                let url = this.endpoints.delete.url
                    .replace(new RegExp("{storage}", "g"), this.storage)
                    .replace(new RegExp("{path}", "g"), item.path);

                let config = {
                    url,
                    method: this.endpoints.delete.method || "post"
                };

                await this.axios.request(config);
                this.$emit("file-deleted");
                this.$emit("loading", false);
            }
        }
    },
    watch: {
        async path() {
            this.items = [];
            await this.load();
        },
        async refreshPending() {
            if (this.refreshPending) {
                await this.load();
                this.$emit("refreshed");
            }
        }
    }
};
</script>

<style lang="scss" scoped>
.v-card {
    height: 100%;
}
</style>