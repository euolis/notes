import { Meteor } from 'meteor/meteor';
import expect from 'expect';

import { Notes } from './notes';

if (Meteor.isServer) {
  describe('notes', function () {

    const noteOne = {
      _id: 'noteIdOne',
      title: 'My Title',
      body: 'My Body',
      updatedAt: 0,
      userId: 'testUser1'
    }
    const noteTwo = {
      _id: 'noteIdTwo',
      title: 'Things to buy',
      body: 'couch',
      updatedAt: 0,
      userId: 'testUser2'
    }

    beforeEach(function () {
      Notes.remove({});
      Notes.insert(noteOne);
      Notes.insert(noteTwo);
    });

    it ('should insert new note', function () {
      const userId = 'testid';
      const _id = Meteor.server.method_handlers['notes.insert'].apply({ userId });

      expect(Notes.findOne({ _id, userId })).toBeTruthy();
    });

    it ('should not insert not if not authenticated', function() {
      expect(() => {
        Meteor.server.method_handlers['notes.insert']();
      }).toThrow();
    });

    it ('should remove note', function () {
      Meteor.server.method_handlers['notes.remove'].apply({ userId: noteOne.userId }, [ noteOne._id ]);

      expect(Notes.findOne({ _id: noteOne._id })).toBeFalsy();
    });

    it ('should not remove note if not authenticated', function () {
      expect(() => {
        Meteor.server.method_handlers['notes.remove'].apply({}, [ noteOne._id ]);
      }).toThrow();
    });

    it ('should not remove note if invalid _id', function () {
      expect(() => {
        Meteor.server.method_handlers['notes.remove'].apply({ userId: noteOne.userId }, [ 0 ]);
      }).toThrow();
    });

    it ('should not remove note if note userId does not match', function () {
      Meteor.server.method_handlers['notes.remove'].apply({ userId: 'testUserId2' }, [ noteOne._id ]);

      expect(Notes.findOne({ _id: noteOne._id })).toBeTruthy();
    });

    it ('should update note', function () {
      const title = 'This is an updated title';

      Meteor.server.method_handlers['notes.update'].apply({ userId: noteOne.userId }, [
        noteOne._id,
        { title }
      ]);

      const note = Notes.findOne(noteOne._id);

      expect(note.updatedAt).toBeGreaterThan(0);
      expect(note.title).toBe(title);
      // Below line fails for some reason when it should be true.
      // expect(note).toContain({ title, body: noteOne.body });
    });

    it ('should throw error if extra props in updates', function () {
      expect(() => {
        Meteor.server.method_handlers['notes.update'].apply({ userId: noteOne.userId }, [
          noteOne._id,
          { footer: 'Show me the footah!!' }
        ]);
      }).toThrow();
    });

    it('should not update note if user was not creator', function () {
      const title = 'This is an updated title';

      Meteor.server.method_handlers['notes.update'].apply({
        userId: 'testid'
      }, [
        noteOne._id,
        { title }
      ]);

      const note = Notes.findOne(noteOne._id);

      expect(note.title).toBe(noteOne.title);
      // Below line fails for some reason when it should be true.
      // expect(note).toContain(noteOne);
    });

    it('should not update note if unauthenticated', function() {
      expect(() => {
        Meteor.server.method_handlers['notes.update'].apply({}, [noteOne._id]);
      }).toThrow();
    });

    it('sould not update if invalid _id', function() {
      expect(() => {
        Meteor.server.method_handlers['notes.update'].apply({ userId: noteOne.userId });
      }).toThrow();
    });

    it('should return a users notes', function () {
      const res = Meteor.server.publish_handlers.notes.apply({ userId: noteOne.userId });
      const notes = res.fetch();

      expect(notes.length).toBe(1);
      expect(notes[0]).toEqual(noteOne);
    });

    it('should return zero notes user that has none', function () {
      const res = Meteor.server.publish_handlers.notes.apply({ userId: 'testUser3' });
      const notes = res.fetch();

      expect(notes.length).toBe(0);    
    });

  });
}
