ALTER TABLE ways ADD COLUMN start_pt geometry(Point, 3857);
ALTER TABLE ways ADD COLUMN end_pt geometry(Point, 3857);

UPDATE ways SET
    start_pt = ST_StartPoint(the_geom),
    end_pt   = ST_EndPoint(the_geom);
