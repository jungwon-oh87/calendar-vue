<template>
  <v-row class="fill-height">
    <v-col>
      <v-sheet height="64">
        <v-toolbar flat color="white">
          <v-btn
            class="mr-4 px-10"
            color="deep-purple accent-4"
            dark
            raised
            @click="dialog = true"
          >Add</v-btn>
          <v-btn outlined class="mr-4" color="grey darken-2" @click="setToday">Today</v-btn>
          <v-btn fab text small color="grey darken-2" @click="prev">
            <v-icon small>mdi-chevron-left</v-icon>
          </v-btn>
          <v-btn fab text small color="grey darken-2" @click="next">
            <v-icon small>mdi-chevron-right</v-icon>
          </v-btn>
          <v-toolbar-title v-if="$refs.calendar">{{ $refs.calendar.title }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-menu bottom right>
            <template v-slot:activator="{ on, attrs }">
              <v-btn outlined color="grey darken-2" v-bind="attrs" v-on="on">
                <span>{{ typeToLabel[type] }}</span>
                <v-icon right>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="type = 'day'">
                <v-list-item-title>Day</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'week'">
                <v-list-item-title>Week</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'month'">
                <v-list-item-title>Month</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = '4day'">
                <v-list-item-title>4 days</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-toolbar>
      </v-sheet>

      <!-- Add Event Dialog -->
      <v-dialog v-model="dialog" max-width="500">
        <v-card>
          <v-form @submit.prevent="addEvent" class="px-8 py-8">
            <v-text-field v-model="name" type="text" label="Name" required></v-text-field>
            <v-text-field v-model="details" type="text" label="Detail" required></v-text-field>
            <v-text-field v-model="start" type="date" label="Start Date" required></v-text-field>
            <v-text-field v-model="end" type="date" label="End Date" required></v-text-field>
            <v-color-picker v-model="color"></v-color-picker>
            <v-btn
              type="submit"
              color="deep-purple accent-4"
              dark
              class="mr-4"
              @click.stop="dialog=false"
            >Submit</v-btn>
          </v-form>
        </v-card>
      </v-dialog>

      <v-sheet height="600">
        <v-calendar
          ref="calendar"
          v-model="focus"
          color="primary"
          :events="events"
          :event-color="getEventColor"
          :type="type"
          :now="today"
          :event-margin-bottom="3"
          @click:event="showEvent"
          @click:more="viewDay"
          @click:date="viewDay"
          @change="updateRange"
        ></v-calendar>
        <v-menu
          v-model="selectedOpen"
          :close-on-content-click="false"
          :activator="selectedElement"
          offset-x
        >
          <v-card color="grey lighten-4" min-width="350px" flat>
            <v-toolbar :color="selectedEvent.color" dark>
              <v-btn icon @click="deleteEvent(selectedEvent)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
              <v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
              <v-spacer></v-spacer>
            </v-toolbar>
            <v-card-text>
              <form v-if="currentlyEditing !== selectedEvent.id">{{selectedEvent.detail}}</form>
              <form v-else>
                <textarea-autosize
                  v-model="selectedEvent.detail"
                  type="text"
                  style="width: 100%"
                  placeholder="add note"
                  :min-height="100"
                ></textarea-autosize>
              </form>
            </v-card-text>
            <v-card-actions>
              <v-btn
                text
                v-if="currentlyEditing !== selectedEvent.id"
                color="secondary"
                @click.prevent="editEvent(selectedEvent)"
              >Edit</v-btn>
              <v-btn text v-else color="secondary" @click.prevent="updateEvent(selectedEvent)">Save</v-btn>
              <v-btn text color="secondary" @click="selectedOpen = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-sheet>
    </v-col>
  </v-row>
</template>

<script>
import { db } from "@/main";
export default {
  data: () => {
    return {
      focus: new Date().toISOString().substring(0, 10),
      today: new Date().toISOString().substring(0, 10),
      type: "month",
      typeToLabel: {
        month: "Month",
        week: "Week",
        day: "Day",
        "4day": "4 Days",
      },
      name: null,
      details: null,
      start: null,
      end: null,
      color: "#1975D2",
      currentlyEditing: null,
      selectedEvent: {},
      selectedElement: null,
      selectedOpen: false,
      events: [],
      dialog: false,
    };
  },
  mounted() {
    this.getEventsFromFB();
  },
  methods: {
    async getEventsFromFB() {
      let snapshot = await db.collection("calEvent").get();
      let events = [];
      snapshot.forEach((doc) => {
        let event = doc.data();
        event.id = doc.id;
        events.push(event);
      });
      this.events = events;
    },
    async updateEvent(selectedEvent) {
      await db.collection("calEvent").doc(this.currentlyEditing).update({
        detail: selectedEvent.detail,
      });
      this.selectedOpen = false;
      this.currentlyEditing = null;
      console.log(selectedEvent);
    },
    async deleteEvent(selectedEvent) {
      await db
        .collection("calEvent")
        .doc(selectedEvent.id)
        .delete()
        .then(() => {
          console.log("Document successfully deleted!");
        })
        .catch((err) => {
          console.log("Error removing document: ", err);
        });
      this.selectedOpen = false;
      this.getEventsFromFB();
      console.log("delete event done");
    },
    async addEvent() {
      if (this.name && this.details && this.start && this.end) {
        await db.collection("calEvent").add({
          color: this.color,
          name: this.name,
          detail: this.details,
          start: this.start,
          end: this.end,
        });
        this.getEventsFromFB();
        this.name = "";
        this.details = "";
        this.start = "";
        this.end = "";
        this.color = "";
      } else {
        alert("fill required fields, please");
      }
    },
    viewDay({ date }) {
      this.focus = date;
      this.type = "day";
    },
    getEventColor(event) {
      return event.color;
    },
    setToday() {
      this.focus = "";
    },
    prev() {
      this.$refs.calendar.prev();
    },
    next() {
      this.$refs.calendar.next();
    },
    editEvent(event) {
      this.currentlyEditing = event.id;
    },
    showEvent({ nativeEvent, event }) {
      const open = () => {
        console.log("event: ", event);
        this.selectedEvent = event;
        this.selectedElement = nativeEvent.target;
        setTimeout(() => (this.selectedOpen = true), 10);
      };

      if (this.selectedOpen) {
        this.selectedOpen = false;
        setTimeout(open, 10);
      } else {
        open();
      }

      nativeEvent.stopPropagation();
    },
    updateRange({ start, end }) {
      const events = [];

      const min = new Date(`${start.date}T00:00:00`);
      const max = new Date(`${end.date}T23:59:59`);
      const days = (max.getTime() - min.getTime()) / 86400000;
      const eventCount = this.rnd(days, days + 20);

      for (let i = 0; i < eventCount; i++) {
        const allDay = this.rnd(0, 3) === 0;
        const firstTimestamp = this.rnd(min.getTime(), max.getTime());
        const first = new Date(firstTimestamp - (firstTimestamp % 900000));
        const secondTimestamp = this.rnd(2, allDay ? 288 : 8) * 900000;
        const second = new Date(first.getTime() + secondTimestamp);

        events.push({
          name: this.names[this.rnd(0, this.names.length - 1)],
          start: first,
          end: second,
          color: this.colors[this.rnd(0, this.colors.length - 1)],
          timed: !allDay,
        });
      }

      this.events = events;
    },
    rnd(a, b) {
      return Math.floor((b - a + 1) * Math.random()) + a;
    },
  },
};
</script>

<style></style>
